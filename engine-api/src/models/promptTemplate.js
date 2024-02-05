import { runQuery, getDriver } from "../util/db";

export const findPromptTemplateById = async (id, context) => {
  const query = `
    MATCH (prompt:PromptTemplate {id: $id})
    // MATCH (u:User {email: $email})
    // WHERE u.primaryOrganization IS NOT NULL AND u.primaryOrganization IN labels(prompt) 
    // CALL apoc.util.validate(u.primaryOrganization IS NULL, 'The calling User is not configured correctly', [0])
    // CALL apoc.util.validate(NOT(EXISTS((u)<-[:OWNER|MEMBER|VIEWER]-(prompt)) OR prompt.isPrivate<>true OR u:Admin),"permission denied",[0])
    OPTIONAL MATCH (prompt)<-[:DB_HAS_PROMPT]-(dbConnection:DBConnection)
    RETURN prompt, toString(prompt.createdAt) AS createdAt, dbConnection
  `;
  const result = await runQuery({
    query,
    driver: getDriver(),
    args: { id, email: context.email },
    database: process.env.NEO4J_DATABASE,
  });
  const doesPromptExists = result.records.length > 0;
  if (!doesPromptExists) throw new Error(`No prompt exists with id ${id}`);
  const prompt = getPromptFromRecord(result.records[0]);
  return prompt;
};

export const allPromptTemplatesForUser = async (context) => {
  const query = `
  MATCH (prompt:PromptTemplate)
//   MATCH (u:User {email: $email})
//   WHERE u.primaryOrganization IS NOT NULL AND u.primaryOrganization IN labels(prompt) AND (EXISTS((u)<-[:OWNER|MEMBER|VIEWER]-(prompt)) OR u:Admin OR prompt.isPrivate<>true)
  OPTIONAL MATCH (prompt)<-[:DB_HAS_PROMPT]-(dbConnection:DBConnection)
  RETURN prompt, toString(prompt.createdAt) AS createdAt, dbConnection
  ORDER BY dbConnection, prompt.createdAt
  `;
  const result = await runQuery({
    query,
    driver: getDriver(),
    args: { email: context.email },
    database: process.env.NEO4J_DATABASE,
  });
  return result.records.map(getPromptFromRecord);
};

export const getCreatedAt = async (id) => {
    const query = `
      MATCH (e:PromptTemplate {id: $id})
      WITH date(datetime({epochmillis: e.createdAt})) AS createdAt
      RETURN createdAt.month + '-' + createdAt.day + '-' + createdAt.year AS createdAt
    `;
    const result = await runQuery({
      query,
      args: { id },
      driver: getDriver(),
      database: process.env.NEO4J_DATABASE,
    });
    return result.records[0].get("createdAt");
};

export const getUsersForPromptTemplate = async (id) => {
    const query = `
      MATCH (prompt:PromptTemplate {id: $id})
      MATCH (u:User)<-[rel:OWNER|MEMBER|VIEWER]-(prompt)
      WHERE u.primaryOrganization IS NOT NULL AND u.primaryOrganization IN labels(prompt)
      CALL apoc.util.validate(u.primaryOrganization IS NULL, 'The calling User is not configured correctly', [0]) 
      RETURN {role: type(rel), user: {name: u.name, email: u.email, picture: u.picture}} AS user
    `;
    const result = await runQuery({
      query,
      args: { id },
      driver: getDriver(),
      database: process.env.NEO4J_DATABASE,
    });
    return result.records.map((record) => record.get("user"));
};

const getPromptFromRecord = (record) => {
  const promptProperties = record.get("prompt").properties;
  // engineProperties.createdAt = record.get("createdAt");
  const dbConnection =
    record.get("dbConnection") !== null
      ? record.get("dbConnection").properties
      : null;
  return {
    ...promptProperties,
    dbConnection,
  };
};

