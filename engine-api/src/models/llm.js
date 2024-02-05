import { runQuery, getDriver } from "../util/db";

export const findLLMById = async (id, context) => {
  const query = `
    MATCH (llm:LLM {id: $id})
    // MATCH (u:User {email: $email})
    // WHERE u.primaryOrganization IS NOT NULL AND u.primaryOrganization IN labels(llm) 
    // CALL apoc.util.validate(u.primaryOrganization IS NULL, 'The calling User is not configured correctly', [0])
    // CALL apoc.util.validate(NOT(EXISTS((u)<-[:OWNER|MEMBER|VIEWER]-(llm)) OR llm.isPrivate<>true OR u:Admin),"permission denied",[0])
    OPTIONAL MATCH (llm)<-[:DB_HAS_LLM]-(dbConnection:DBConnection)
    OPTIONAL MATCH (cypherPrompt:PromptTemplate {type:"CYPHER"})<-[:LLM_HAS_PROMPT]-(llm)
    OPTIONAL MATCH (qaPrompt:PromptTemplate {type:"QA"})<-[:LLM_HAS_PROMPT]-(llm)
    RETURN llm, cypherPrompt as cypherPromptTemplate, qaPrompt as qaPromptTemplate, toString(llm.createdAt) AS createdAt, dbConnection
  `;
  const result = await runQuery({
    query,
    driver: getDriver(),
    args: { id, email: context.email },
    database: process.env.NEO4J_DATABASE,
  });
  const doesLLMExists = result.records.length > 0;
  if (!doesLLMExists) throw new Error(`No llm exists with id ${id}`);
  const llm = getLLMFromRecord(result.records[0]);
  return llm;
};

export const allLLMsForUser = async (context) => {
  const query = `
  MATCH (llm:LLM)
//   MATCH (u:User {email: $email})
//   WHERE u.primaryOrganization IS NOT NULL AND u.primaryOrganization IN labels(llm) AND (EXISTS((u)<-[:OWNER|MEMBER|VIEWER]-(llm)) OR u:Admin OR llm.isPrivate<>true)
  OPTIONAL MATCH (llm)<-[:DB_HAS_LLM]-(dbConnection:DBConnection)
  OPTIONAL MATCH (prompt)<-[:DB_HAS_PROMPT]-(dbConnection)
  RETURN llm, prompt as promptTemplate, toString(llm.createdAt) AS createdAt, dbConnection
  ORDER BY dbConnection, llm.createdAt
  `;
  const result = await runQuery({
    query,
    driver: getDriver(),
    args: { email: context.email },
    database: process.env.NEO4J_DATABASE,
  });
  return result.records.map(getLLMFromRecord);
};

export const getCreatedAt = async (id) => {
    const query = `
      MATCH (e:LLM {id: $id})
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

export const getUsersForLLM = async (id) => {
    const query = `
      MATCH (llm:LLM {id: $id})
      MATCH (u:User)<-[rel:OWNER|MEMBER|VIEWER]-(llm)
      WHERE u.primaryOrganization IS NOT NULL AND u.primaryOrganization IN labels(llm)
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

export const getSampleQuestions = async (id) => {
  const query = `
    MATCH (llm:LLM {id: $id})
    OPTIONAL MATCH (llm)<-[:DB_HAS_LLM]-(dbConnection:DBConnection)
    OPTIONAL MATCH (dbConnection)-[:HAS_SAMPLE_QUESTIONS]->(sampleQuestions:SampleQuestion)
    RETURN {priority : sampleQuestions.priority, question: sampleQuestions.question, createdAt:  sampleQuestions.createdAt } as sampleQuestions
  `;
  const result = await runQuery({
    query,
    args: { id },
    driver: getDriver(),
    database: process.env.NEO4J_DATABASE,
  });
  return result.records.map((record) => record.get("sampleQuestions"));
};

const getLLMFromRecord = (record) => {
  const llmProperties = record.get("llm").properties;
  const dbConnection =
    record.get("dbConnection") !== null
      ? record.get("dbConnection").properties
      : null;
  const cypherPromptTemplate =
    record.get("cypherPromptTemplate") !== null
    ? record.get("cypherPromptTemplate").properties
    : null;
  const qaPromptTemplate =
    record.get("qaPromptTemplate") !== null
    ? record.get("qaPromptTemplate").properties
    : null;
  return {
    ...llmProperties,
    dbConnection,
    cypherPromptTemplate,
    qaPromptTemplate,
  };
};

