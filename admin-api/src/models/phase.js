import { runQuery, getDriver } from "../util/db";
import { PhaseSet } from "../util/constants";

export const getPhaseFromPhaseNode = (node) => {
  const phase = {
    ...node.properties,
    phaseType: getPhaseType(node),
  };
  if (!("description" in phase)) {
    phase.description = "";
  }
  return phase;
};

const getPhaseType = (node) => {
  return node.labels.filter((label) => PhaseSet.has(label))[0];
};

export const writePhaseToDB = async (
  engineID,
  prevPhaseID,
  phaseType,
  {
    inverted,
    maxAmount,
    active = false,
    cypherQuery = "",
    description = "",
    showCypher = true,
    name = "Unnamed Phase",
  },
  context
) => {
  const phaseProperties = {
    name,
    active,
    inverted,
    maxAmount,
    showCypher,
    cypherQuery,
    description,
  };
  // Set reasonable defaults
  if (
    phaseType === "CypherExcludePhase" &&
    phaseProperties.inverted === undefined
  ) {
    phaseProperties.inverted = false;
  }
  if (
    phaseType === "CypherDiversityPhase" &&
    phaseProperties.maxAmount === undefined
  ) {
    phaseProperties.maxAmount = 3;
  }
  let query;
  if (prevPhaseID === null) {
    query = `
      MATCH (engine:Engine {id: $engineID}),(u:User{email: $email})
      WHERE u.primaryOrganization IS NOT NULL AND u.primaryOrganization IN labels(engine) 
      //CALL apoc.util.validate(NOT(exists(u.primaryOrganization)), 'The calling User is not configured correctly', [0])
      CALL apoc.util.validate(u.primaryOrganization IS NULL, 'The calling User is not configured correctly', [0])
      CALL apoc.util.validate(NOT(EXISTS((u)<-[:OWNER|MEMBER]-(engine)) or u:Admin),"permission denied",[0])
      OPTIONAL MATCH (engine)-[old:HAS_START_PHASE]->(oldStart:Phase)
      CREATE (new:${phaseType}:Phase {id: apoc.create.uuid()})
      SET new += $phaseProperties
      WITH *
      CALL apoc.create.addLabels([new], [u.primaryOrganization]) YIELD node as phaseNode
      CREATE (engine)-[:HAS_START_PHASE]->(new)
      WITH new, old, oldStart
      WHERE NOT oldStart IS NULL
      CREATE (new)-[:NEXT_PHASE]->(oldStart)
      DELETE old
      RETURN new
    `;
  } else {
    query = `
      MATCH (prevPhase:Phase {id: $prevPhaseID})<-[:HAS_START_PHASE|NEXT_PHASE*]-(engine:Engine),(u:User{email: $email})
      WHERE u.primaryOrganization IS NOT NULL AND u.primaryOrganization IN labels(engine) AND u.primaryOrganization IN labels(prevPhase) 
      //CALL apoc.util.validate(NOT(exists(u.primaryOrganization)), 'The calling User is not configured correctly', [0])
      CALL apoc.util.validate(u.primaryOrganization IS NULL, 'The calling User is not configured correctly', [0])
      CALL apoc.util.validate(NOT(EXISTS((u)<-[:OWNER|MEMBER]-(engine)) or u:Admin),"permission denied",[0])
      OPTIONAL MATCH (prevPhase)-[old:NEXT_PHASE]->(next:Phase)
      CREATE (new:${phaseType}:Phase {id: apoc.create.uuid()})
      SET new += $phaseProperties
      WITH *
      CALL apoc.create.addLabels([new], [u.primaryOrganization]) YIELD node as phaseNode
      CREATE (prevPhase)-[:NEXT_PHASE]->(new)
      WITH new, next, old
      WHERE next IS NOT NULL
      CREATE (new)-[:NEXT_PHASE]->(next)
      DELETE old
      RETURN new
  `;
  }
  const result = await runQuery({
    query,
    args: {
      engineID,
      prevPhaseID,
      phaseProperties,
      email: context.email,
    },
    driver: getDriver(),
    database: process.env.NEO4J_DATABASE,
  });
  const isOnlyPhase = result.records.length === 0;
  if (isOnlyPhase) {
    const newResult = await runQuery({
      args: { engineID },
      driver: getDriver(),
      database: process.env.NEO4J_DATABASE,
      query:
        "MATCH (e:Engine {id: $engineID})-[:HAS_START_PHASE]->(p:Phase)  RETURN p",
    });
    return getPhaseFromPhaseNode(newResult.records[0].get("p"));
  }
  return getPhaseFromPhaseNode(result.records[0].get("new"));
};

export const editPhaseInDB = async (id, properties, context) => {
  const query = `
    MATCH (phase:Phase {id: $id})<-[:HAS_START_PHASE|NEXT_PHASE*]-(engine:Engine),(u:User{email: $email})
    WHERE u.primaryOrganization IS NOT NULL AND u.primaryOrganization IN labels(engine) AND u.primaryOrganization IN labels(phase) 
    //CALL apoc.util.validate(NOT(exists(u.primaryOrganization)), 'The calling User is not configured correctly', [0])
    CALL apoc.util.validate(u.primaryOrganization IS NULL, 'The calling User is not configured correctly', [0])
    CALL apoc.util.validate(NOT (EXISTS((u)<-[:OWNER|MEMBER]-(engine)) or u:Admin),"permission denied",[0])
    SET phase += $properties
    WITH *
    CALL apoc.create.addLabels([phase], [u.primaryOrganization]) YIELD node as phaseNode
    RETURN phase
  `;
  const result = await runQuery({
    query,
    driver: getDriver(),
    database: process.env.NEO4J_DATABASE,
    args: { id, properties, email: context.email },
  });
  return getPhaseFromPhaseNode(result.records[0].get("phase"));
};

export const deletePhaseFromDB = async (id, context) => {
  const firstPhaseQuery = `
  MATCH (phase:Phase {id: $id})<-[:HAS_START_PHASE|NEXT_PHASE*]-(e:Engine),(u:User{email: $email})
  WHERE u.primaryOrganization IS NOT NULL AND u.primaryOrganization IN labels(e) AND u.primaryOrganization IN labels(phase) 
  //CALL apoc.util.validate(NOT(exists(u.primaryOrganization)), 'The calling User is not configured correctly', [0])
  CALL apoc.util.validate(u.primaryOrganization IS NULL, 'The calling User is not configured correctly', [0])
  CALL apoc.util.validate(NOT (EXISTS((u)<-[:OWNER|MEMBER]-(e)) or u:Admin),"permission denied",[0])
  OPTIONAL MATCH (engine:Engine)-[:HAS_START_PHASE]->(phase)
  OPTIONAL MATCH (phase)-[:NEXT_PHASE]->(next:Phase)
  WITH phase, engine, next
  WHERE engine IS NOT NULL
  DETACH DELETE phase
  WITH engine, next
  WHERE next IS NOT NULL
  CREATE (engine)-[:HAS_START_PHASE]->(next)
  `;
  const middlePhaseQuery = `
    MATCH (phase:Phase {id: $id})<-[:HAS_START_PHASE|NEXT_PHASE*]-(e:Engine),(u:User{email: $email})
    WHERE u.primaryOrganization IS NOT NULL AND u.primaryOrganization IN labels(e) AND u.primaryOrganization IN labels(phase)
    //CALL apoc.util.validate(NOT(exists(u.primaryOrganization)), 'The calling User is not configured correctly', [0])
    CALL apoc.util.validate(u.primaryOrganization IS NULL, 'The calling User is not configured correctly', [0])
    CALL apoc.util.validate(NOT (EXISTS((u)<-[:OWNER|MEMBER]-(e)) or u:Admin),"permission denied",[0])
    OPTIONAL MATCH (phase)-[:NEXT_PHASE]->(next:Phase)
    OPTIONAL MATCH (prev:Phase)-[:NEXT_PHASE]->(phase)
    WITH prev, phase, next
    WHERE prev IS NOT NULL AND next IS NOT NULL
    CREATE (prev)-[:NEXT_PHASE]->(next)
    DETACH DELETE phase
  `;
  const lastPhaseQuery = `
    MATCH (phase:Phase {id: $id})<-[:HAS_START_PHASE|NEXT_PHASE*]-(e:Engine),(u:User{email: $email})
    WHERE u.primaryOrganization IS NOT NULL AND u.primaryOrganization IN labels(e) AND u.primaryOrganization IN labels(phase)
    //CALL apoc.util.validate(NOT(exists(u.primaryOrganization)), 'The calling User is not configured correctly', [0])
    CALL apoc.util.validate(u.primaryOrganization IS NULL, 'The calling User is not configured correctly', [0])
    CALL apoc.util.validate(NOT (EXISTS((u)<-[:OWNER|MEMBER]-(e)) or u:Admin),"permission denied",[0])
    OPTIONAL MATCH (phase)-[:NEXT_PHASE]->(next:Phase)
    OPTIONAL MATCH (prev:PHASE)-[:NEXT_PHASE]->(phase)
    WHERE prev IS NOT NULL AND next IS NULL
    DETACH DELETE phase
  `;
  // if deleting the first phase in a pipeline
  let result = await runQuery({
    query: firstPhaseQuery,
    driver: getDriver(),
    args: { id, email: context.email },
    database: process.env.NEO4J_DATABASE,
  });
  let wasDeleteSuccessful = result.summary.counters._stats.nodesDeleted;
  if (wasDeleteSuccessful) return true;
  // if deleting a middle phase in a pipeline
  result = await runQuery({
    query: middlePhaseQuery,
    driver: getDriver(),
    args: { id, email: context.email },
    database: process.env.NEO4J_DATABASE,
  });
  wasDeleteSuccessful = result.summary.counters._stats.nodesDeleted;
  if (wasDeleteSuccessful) return true;
  // if deleting the last phase in a pipeline
  result = await runQuery({
    query: lastPhaseQuery,
    driver: getDriver(),
    args: { id, email: context.email },
    database: process.env.NEO4J_DATABASE,
  });
  wasDeleteSuccessful = result.summary.counters._stats.nodesDeleted;
  if (wasDeleteSuccessful) return true;
  return wasDeleteSuccessful;
};
