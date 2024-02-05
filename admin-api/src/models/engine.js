import axios from "axios";
import { getPhaseFromPhaseNode } from "./phase.js";
import { runQuery, getDriver } from "../util/db";
import {
  getLicenseRestriction,
  LicenseRestriction,
} from "../util/license/license";

export const findEngineByID = async (id, context) => {
  const query = `
    MATCH (engine:Engine {id: $id})
    MATCH (u:User {email: $email})
    WHERE u.primaryOrganization IS NOT NULL AND u.primaryOrganization IN labels(engine) 
    //CALL apoc.util.validate(NOT(exists(u.primaryOrganization)), 'The calling User is not configured correctly', [0])
    CALL apoc.util.validate(u.primaryOrganization IS NULL, 'The calling User is not configured correctly', [0])
    CALL apoc.util.validate(NOT(EXISTS((u)<-[:OWNER|MEMBER|VIEWER]-(engine)) OR engine.isPrivate<>true OR u:Admin),"permission denied",[0])
    OPTIONAL MATCH (engine)-[:CONNECTS_TO]->(dbConnection:DBConnection)
    OPTIONAL MATCH p=(engine)-[:HAS_START_PHASE|NEXT_PHASE*]->(phase:Phase)
    WITH engine, phase, length(p) AS position, dbConnection
    ORDER BY position
    RETURN engine, collect(phase) as phases, toString(engine.createdAt) AS createdAt, dbConnection
  `;
  const result = await runQuery({
    query,
    driver: getDriver(),
    args: { id, email: context.email },
    database: process.env.NEO4J_DATABASE,
  });
  const doesEngineExist = result.records.length > 0;
  if (!doesEngineExist) throw new Error(`No engine exists with id ${id}`);
  const engine = getEngineFromRecord(result.records[0]);
  return engine;
};

export const allEnginesForUser = async (context) => {
  const query = `
  MATCH (engine:Engine)
  MATCH (u:User {email: $email})
  WHERE u.primaryOrganization IS NOT NULL AND u.primaryOrganization IN labels(engine) AND (EXISTS((u)<-[:OWNER|MEMBER|VIEWER]-(engine)) OR u:Admin OR engine.isPrivate<>true)
  OPTIONAL MATCH (engine)-[:CONNECTS_TO]->(dbConnection:DBConnection)
  OPTIONAL MATCH (engine)-[:HAS_START_PHASE|NEXT_PHASE*]->(phase:Phase)
  RETURN engine, collect(phase) as phases, toString(engine.createdAt) AS createdAt, dbConnection
  ORDER BY dbConnection, engine.createdAt
  `;
  const result = await runQuery({
    query,
    driver: getDriver(),
    args: { email: context.email },
    database: process.env.NEO4J_DATABASE,
  });
  return result.records.map(getEngineFromRecord);
};

export const createEngine = async (input, context) => {
  const maxNumberOfEngines = getLicenseRestriction(
    LicenseRestriction.MaxNumberOfEngines
  );
  const dbID = input.dbConnectionID;
  const engineProps = {
    id: input.id,
    name: input.name,
    databaseName: input.databaseName,
    description: input.description,
    isPrivate: input.isPrivate,
    returnLabel: input.returnLabel,
    returnProperties: input.returnProperties,
    dataModel: input.dataModel,
  };
  const query = `
    WITH $email as email, $dbID as dbID, $engineProps as engineProps,$maxNumberOfEngines as maxNumberOfEngines
    MATCH (u:User {email: email})
    MATCH (db:DBConnection {id: dbID})
    OPTIONAL MATCH (currentEngine:Engine)
    // added a condition here in case there are 0 engines present
    CALL apoc.util.validate((u.primaryOrganization IN coalesce(labels(currentEngine),[]) AND (currentEngine.id IS NULL OR currentEngine.id = engineProps.id)), 'The Engine Already Exists', [0])
    CALL apoc.util.validate(u.primaryOrganization IS NULL, 'The calling User is not configured correctly', [0])
    CALL apoc.util.validate(NOT (EXISTS((u)<-[:OWNER|MEMBER|VIEWER]-(db)) OR db.isPrivate<>true OR u:Admin),"permission denied",[0])
    OPTIONAL MATCH (existing:Engine)
    WITH u, db, engineProps,maxNumberOfEngines,COUNT(existing) AS numExistingEngines
    CALL apoc.util.validate(numExistingEngines >= maxNumberOfEngines,"Max number of licensed engines reached",[0])
    CREATE (u)<-[:CREATOR]-(engine:Engine)
    CREATE (u)<-[:OWNER]-(engine)
    CREATE (engine)-[:CONNECTS_TO]->(db)
    SET engine.createdAt = timestamp()
    SET engine += engineProps
    WITH engine, u, db
    CALL apoc.create.addLabels([engine], [u.primaryOrganization]) YIELD node as dbConnectionNode
    RETURN engine, [] AS phases, toString(engine.createdAt) AS createdAt, db AS dbConnection
  `;
  const result = await runQuery({
    query,
    args: {
      dbID,
      engineProps,
      email: context.email,
      maxNumberOfEngines: maxNumberOfEngines,
    },
    driver: getDriver(),
    database: process.env.NEO4J_DATABASE,
  });
  if (result.code && result.code.includes("ConstraintValidationFailed"))
    return new Error("An engine with that id already exists");
  return result &&
    result.constructor &&
    result.constructor.name === "Neo4jError"
    ? new Error(result.message)
    : getEngineFromRecord(result.records[0]);
};

export const canUserAddEngine = async (context) => {
  const query = `
  MATCH (u:User {email: $email})
  CALL apoc.when(u:Admin OR u:Neo4j, 'RETURN true as flag', 'RETURN false as flag',{u:u}) yield value
  return value.flag as result`;

  const result = await runQuery({
    query,
    driver: getDriver(),
    args: { email: context.email },
    database: process.env.NEO4J_DATABASE,
  });
  return result.records[0].get("result");
};

export const editEngine = async (id, dbConnectionID, input, context) => {
  const query = `
    MATCH (engine:Engine {id: $id})
    MATCH (u: User {email: $email})
    MATCH (db:DBConnection {id: $dbConnectionID})
    WHERE u.primaryOrganization IS NOT NULL AND u.primaryOrganization IN labels(engine) AND u.primaryOrganization IN labels(db)
    //CALL apoc.util.validate(NOT(exists(u.primaryOrganization)), 'The calling User is not configured correctly', [0])
    CALL apoc.util.validate(u.primaryOrganization IS NULL, 'The calling User is not configured correctly', [0])
    CALL apoc.util.validate(NOT (EXISTS((u)<-[:OWNER]-(engine)) OR u:Admin),"permission denied",[0])
    OPTIONAL MATCH (engine)-[r:CONNECTS_TO]->(:DBConnection)
    OPTIONAL MATCH (engine)-[:HAS_START_PHASE|NEXT_PHASE*]->(p:Phase)
    DELETE r
    MERGE (engine)-[:CONNECTS_TO]->(db)
    SET engine += $input
    RETURN engine, collect(p) AS phases, toString(engine.createdAt) AS createdAt, db AS dbConnection
  `;
  const result = await runQuery({
    query,
    args: {
      id,
      dbConnectionID,
      input,
      email: context.email,
    },
    driver: getDriver(),
    database: process.env.NEO4J_DATABASE,
  });
  return getEngineFromRecord(result.records[0]);
};

export const deleteEngine = async (id, context) => {
  const query = `
    MATCH (engine:Engine {id: $id})
    MATCH (u: User{email: $email} )
    WHERE u.primaryOrganization IS NOT NULL AND u.primaryOrganization IN labels(engine) 
    //CALL apoc.util.validate(NOT(exists(u.primaryOrganization)), 'The calling User is not configured correctly', [0])
    CALL apoc.util.validate(u.primaryOrganization IS NULL, 'The calling User is not configured correctly', [0])
    CALL apoc.util.validate(NOT (EXISTS((u)<-[:OWNER]-(engine)) OR u:Admin), "permission denied",[0])
    OPTIONAL MATCH (engine)-[:HAS_START_PHASE|NEXT_PHASE*]->(phase:Phase)
    DETACH DELETE engine, phase
  `;
  const result = await runQuery({
    query,
    driver: getDriver(),
    args: { id, email: context.email },
    database: process.env.NEO4J_DATABASE,
  });
  const wereNodesDeleted = result.summary.counters._stats.nodesDeleted > 0;
  if (wereNodesDeleted) return { id };
};

export const getCreatedAt = async (id) => {
  const query = `
    MATCH (e:Engine {id: $id})
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

export const getUsersForEngine = async (id) => {
  const query = `
    MATCH (engine:Engine {id: $id})
    MATCH (u:User)<-[rel:OWNER|MEMBER|VIEWER]-(engine)
    WHERE u.primaryOrganization IS NOT NULL AND u.primaryOrganization IN labels(engine)
    //CALL apoc.util.validate(NOT(exists(u.primaryOrganization)), 'The calling User is not configured correctly', [0])
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

export const canCurrentUserEdit = async (id, context) => {
  const query = `
    MATCH (u:User {email: $email}), (engine:Engine {id: $id})
    WHERE u.primaryOrganization IS NOT NULL AND u.primaryOrganization IN labels(engine)
    //CALL apoc.util.validate(NOT(exists(u.primaryOrganization)), 'The calling User is not configured correctly', [0])
    CALL apoc.util.validate(u.primaryOrganization IS NULL, 'The calling User is not configured correctly', [0])
    RETURN (u:Admin OR EXISTS((engine)-[:OWNER|MEMBER]->(u))) AS result
  `;
  const result = await runQuery({
    query,
    driver: getDriver(),
    args: { id, email: context.email },
    database: process.env.NEO4J_DATABASE,
  });
  return result.records[0].get("result");
};

export const canCurrentUserDelete = async (id, context) => {
  const query = `
    MATCH (u:User {email: $email}), (engine:Engine {id: $id})
    WHERE u.primaryOrganization IS NOT NULL AND u.primaryOrganization IN labels(engine)
    //CALL apoc.util.validate(NOT(exists(u.primaryOrganization)), 'The calling User is not configured correctly', [0])
    CALL apoc.util.validate(u.primaryOrganization IS NULL, 'The calling User is not configured correctly', [0])
    RETURN (u:Admin OR EXISTS((engine)-[:OWNER]->(u))) AS result
  `;
  const result = await runQuery({
    query,
    driver: getDriver(),
    args: { id, email: context.email },
    database: process.env.NEO4J_DATABASE,
  });
  return result.records[0].get("result");
};

export const importEngine = async (id, engine, context) => {
  const query = `
    MATCH (engine:Engine {id: $id})
    MATCH (user:User {email: $email})
    WHERE user.primaryOrganization IN labels(engine)
    // CALL apoc.util.validate(user.primaryOrganization IS NULL, 'The calling User is not configured correctly', [0])
    // CALL apoc.util.validate(NOT (EXISTS((user)<-[:OWNER|MEMBER]-(engine)) OR user:Admin), "permission denied", [0])
    OPTIONAL MATCH (engine)-[:HAS_START_PHASE|NEXT_PHASE*]->(p)
    DETACH DELETE p
    WITH engine,user, $engine.phases AS phases LIMIT 1
    UNWIND range(0, size(phases)-1) AS i
    CREATE (p:Phase)
    SET
      p.id = apoc.create.uuid(),
      p.name = phases[i].name,
      p.description = phases[i].description,
      p.active = phases[i].active,
      p.showCypher = phases[i].showCypher,
      p.cypherQuery = phases[i].cypherQuery,
      p.inverted = phases[i].inverted,
      p.maxAmount = phases[i].maxAmount
    WITH engine, p, phases[i].phaseType AS type, user
    CALL apoc.create.addLabels(p, [type]) YIELD node
    CALL apoc.create.addLabels([p], [user.primaryOrganization]) YIELD node as phaseNode
    WITH engine, collect(p) AS phases, head(collect(p)) as first
    MERGE (engine)-[:HAS_START_PHASE]->(first)
    WITH phases
    UNWIND apoc.coll.pairs(phases) AS pair
    WITH pair[0] AS p0, pair[1] AS p1
    WHERE NOT p1 IS NULL
    MERGE (p0)-[:NEXT_PHASE]->(p1)
  `;
  const result = await runQuery({
    query,
    driver: getDriver(),
    database: process.env.NEO4J_DATABASE,
    args: { id, engine, email: context.email },
  });
  return result ? true : false;
};

const getEngineFromRecord = (record) => {
  const engineProperties = record.get("engine").properties;
  // engineProperties.createdAt = record.get("createdAt");
  const phases = record.get("phases").map(getPhaseFromPhaseNode);
  const dbConnection =
    record.get("dbConnection") !== null
      ? record.get("dbConnection").properties
      : null;
  return {
    ...engineProperties,
    phases,
    dbConnection,
  };
};

export const runBatchEngine = async (args) => {
  const { engineID, params, delaySeconds, timeIntervalSeconds } = args;
  // Need to manually parse JSON obj as JSON.stringify will not work
  let paramString = "";
  Object.keys(params).map((key) => {
    paramString = paramString + key + ": " + params[key];
  });
  const response = await axios
    .post(
      process.env.ENGINE_API_URI,
      {
        query: `
          query {
            runBatchEngine(
              engineID: "${engineID}"
              delaySeconds: ${delaySeconds}
              timeIntervalSeconds: ${timeIntervalSeconds}
              params: ${"{" + paramString + "}"}
            )
          }
        `,
      },
      { headers: { "api-key": process.env.ENGINE_API_APIKEY } }
    )
    .catch((err) => {
      return err;
    });
  return response.data.data.runBatchEngine;
};

export const isBatchEngineRunning = async (args) => {
  const { engineID } = args;
  const response = await axios
    .post(
      process.env.ENGINE_API_URI,
      {
        query: `
          query {
            isBatchEngineRunning(
              engineID: "${engineID}"
            )
          }
        `,
      },
      { headers: { "api-key": process.env.ENGINE_API_APIKEY } }
    )
    .catch((err) => {
      return err;
    });
  return response.data.data.isBatchEngineRunning;
};

export const cancelBatchEngine = async (args) => {
  const { engineID } = args;
  const response = await axios
    .post(
      process.env.ENGINE_API_URI,
      {
        query: `
          query {
            cancelBatchEngine(
              engineID: "${engineID}"
            )
          }
        `,
      },
      { headers: { "api-key": process.env.ENGINE_API_APIKEY } }
    )
    .catch((err) => {
      return err;
    });
  return response.data.data.cancelBatchEngine;
};
