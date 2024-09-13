import { runQuery, getDriver } from "../util/db";
import { PhaseSet } from "../util/constants";
import { logger } from "../index";
import { v4 as uuidv4 } from 'uuid';

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
  const transactionId = uuidv4();  
  const apiCallName = "writePhaseToDB";
  const phaseProperties = {
    name,
    active,
    inverted,
    maxAmount,
    showCypher,
    cypherQuery,
    description,
  };
  try { 
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
    // Log that the API call has been initiated
    logger.info(`Transaction ID: ${transactionId} - API: ${apiCallName} - User with email ${context.email} is adding a new phase to Engine - "${engineID}"`);
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
    // Check if any nodes were created using result.summary.counters
    const nodesCreated = result.summary.counters._stats.nodesCreated
    // If no nodes were created, handle the failure case
    if (nodesCreated === 0) {
      logger.error(`Transaction ID: ${transactionId} - API: ${apiCallName} - Failed to add a new phase for engine "${engineID}" by user ${context.email}. No phase node was created.`);
      throw new Error("Failed to create a new phase");
    }
    const isOnlyPhase = result.records.length === 0;
    if (isOnlyPhase) {
      const newResult = await runQuery({
        args: { engineID },
        driver: getDriver(),
        database: process.env.NEO4J_DATABASE,
        query:
          "MATCH (e:Engine {id: $engineID})-[:HAS_START_PHASE]->(p:Phase)  RETURN p",
      });
      const phaseNodeResult = getPhaseFromPhaseNode(newResult.records[0].get("p"));
      // Log that the API call has been initiated
      logger.info(`Transaction ID: ${transactionId} - API: ${apiCallName} - User with email ${context.email} added a new phase to Engine - "${engineID}"`);
      return phaseNodeResult
    }
    return getPhaseFromPhaseNode(result.records[0].get("new"));
  } 
  catch(error) {
    logger.error(`Transaction ID: ${transactionId} -  API: ${apiCallName} - Failed to add a new phase to Engine - "${engineID}" for user ${context.email}: ${error.message}`);
    throw new Error('Failed to write phase to DB');
  }
};

export const editPhaseInDB = async (id, properties, context) => {
  const transactionId = uuidv4();  
  const apiCallName = "editPhaseInDB";
  try {
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
  logger.info(`Transaction ID: ${transactionId} - API: ${apiCallName} - User with email ${context.email} is attempting to edit phase with ID - "${id}" having name "${properties.name}"`);
  const result = await runQuery({
    query,
    driver: getDriver(),
    database: process.env.NEO4J_DATABASE,
    args: { id, properties, email: context.email },
  }); 
  const editedPhaseNode = getPhaseFromPhaseNode(result.records[0].get("phase"));
  logger.info(`Transaction ID: ${transactionId} - API: ${apiCallName} - User with email ${context.email} edited a phase with ID "${id}" having name "${properties.name}"`);
  return editedPhaseNode
  } 
  catch(error) {
    logger.error(`Transaction ID: ${transactionId} -  API: ${apiCallName} - Failed to edit the phase with ID "${id}" having name "${properties.name}" for user ${context.email}: ${error.message}`);
    throw new Error('Failed to edit the phase');
  }
  
};

export const deletePhaseFromDB = async (id, context) => {
  const transactionId = uuidv4();  
  const apiCallName = "deletePhaseFromDB";
  try {
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
  logger.info(`Transaction ID: ${transactionId} - API: ${apiCallName} - User with email ${context.email} is attempting to delete phase with ID - "${id}"`);
  // if deleting the first phase in a pipeline
  let result = await runQuery({
    query: firstPhaseQuery,
    driver: getDriver(),
    args: { id, email: context.email },
    database: process.env.NEO4J_DATABASE,
  });
  let wasDeleteSuccessful = result.summary.counters._stats.nodesDeleted;
  if (wasDeleteSuccessful) {
    logger.info(`Transaction ID: ${transactionId} - API: ${apiCallName} - User with email ${context.email} successfully deleted the first phase with ID - "${id}"`);
    return true;
  }
  // if deleting a middle phase in a pipeline
  result = await runQuery({
    query: middlePhaseQuery,
    driver: getDriver(),
    args: { id, email: context.email },
    database: process.env.NEO4J_DATABASE,
  });
  wasDeleteSuccessful = result.summary.counters._stats.nodesDeleted;
  if (wasDeleteSuccessful) {
    logger.info(`Transaction ID: ${transactionId} - API: ${apiCallName} - User with email ${context.email} successfully deleted the Middle phase with ID - "${id}"`);
    return true;
  }
  // if deleting the last phase in a pipeline
  result = await runQuery({
    query: lastPhaseQuery,
    driver: getDriver(),
    args: { id, email: context.email },
    database: process.env.NEO4J_DATABASE,
  });
  wasDeleteSuccessful = result.summary.counters._stats.nodesDeleted;
  if (wasDeleteSuccessful) {
    logger.info(`Transaction ID: ${transactionId} - API: ${apiCallName} - User with email ${context.email} successfully deleted the Last phase with ID - "${id}"`);
    return true;
  }
  logger.info(`Transaction ID: ${transactionId} - API: ${apiCallName} - User with email ${context.email} attempted to delete the phase with ID - "${id}", but no deletion occurred`);
  return wasDeleteSuccessful;
  } 
  catch(error) {
    logger.error(`Transaction ID: ${transactionId} -  API: ${apiCallName} - Failed to delete the phase with ID "${id}" having name "${properties.name}" for user ${context.email}: ${error.message}`);
    throw new Error('Failed to delete the phase');
  }
};
