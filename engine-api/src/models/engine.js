import { getPhaseFromPhaseNode } from "./phase.js";
import { runQuery, validateQueryResult, getDriver } from "../util/db";

const getSecurityOrgCondition = (context) => {
  context = context || {};
  const securityOrg = (context.securityOrg) ? context.securityOrg : '';
  const securityOrgCondition = (securityOrg) ? `:${securityOrg}` : '';
  return securityOrgCondition;
}

/* Get the engine with the given id */
export const findEngineByID = async (id, context) => {
  const securityOrgCondition = getSecurityOrgCondition(context);
  const securityCleanedOrgCondition = ":`" + securityOrgCondition.slice(1,) + "`";
  const query = `
    MATCH(engine: Engine${securityCleanedOrgCondition} { id: $id })
    OPTIONAL MATCH(engine) - [: CONNECTS_TO] -> (dbConnection: DBConnection)
    OPTIONAL MATCH(engine) - [: HAS_START_PHASE | NEXT_PHASE *] -> (phase:Phase)
    RETURN engine, collect(phase) as phases, toString(engine.createdAt) AS createdAt, dbConnection
    `;
  const result = await runQuery({
    query,
    args: { id },
    driver: getDriver(),
    database: process.env.NEO4J_DATABASE,
  });
  validateQueryResult(result, `No engine exists with id: ${id}.`);
  const engine = getEngineFromRecord(result.records[0]);
  return engine;
};

/* Get all phases with an id contained in the phaseIDs list */
export const findPhasesByID = async (phaseIDs, context) => {
  const securityOrgCondition = getSecurityOrgCondition(context);
  const securityCleanedOrgCondition = ":`" + securityOrgCondition.slice(1,) + "`";
  const query = `
    UNWIND $phaseIDs as id
  MATCH(p: Phase${securityCleanedOrgCondition}) < -[: HAS_START_PHASE | NEXT_PHASE *] - (engine:Engine${securityCleanedOrgCondition}) -[: CONNECTS_TO] -> (dbConnection:DBConnection${securityCleanedOrgCondition}) where p.id = id
    RETURN engine, collect(p) as phases, toString(engine.createdAt) AS createdAt, dbConnection
    `;
  const result = await runQuery({
    query,
    args: { phaseIDs },
    driver: getDriver(),
    database: process.env.NEO4J_DATABASE,
  });
  validateQueryResult(
    result,
    "One or more of the provided phase ids do not exist."
  );
  const engine = getEngineFromRecord(result.records[0]);
  return engine;
};

/* Engine unpack helper */
const getEngineFromRecord = (record) => {
  try {
    const engineProperties = record.get("engine").properties;
    engineProperties.createdAt = record.get("createdAt");
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
  } catch (e) {
    throw new Error(
      `The following error occured while compiling the given engine: ${e}.`
    );
  }
};
