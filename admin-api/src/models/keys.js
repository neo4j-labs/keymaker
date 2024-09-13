import { encrypt, decrypt } from "../util/encryption/crypto";
import { runQuery, getDriver } from "../util/db";
import { logger } from "../index";
import { v4 as uuidv4 } from 'uuid';

export const createAPIKeyForOrg = async (org, duration, { email }) => {
  // create a new API and check if it exists in the database
  let key = makeKey(24);
  let keyExists = await getAPIKey(key);
  // regenerate a new key if the old one already exists
  while (keyExists) {
    key = makeKey(24);
    keyExists = await getAPIKey(key);
  }
  // build the query to write the key, include an expirationDate if specified
  let query = `
    MATCH (u:User:Admin:Neo4j {email: $email})
    WHERE u.primaryOrganization IS NOT NULL
    CALL apoc.util.validate(NOT(exists(u.primaryOrganization)), 'The calling User is not configured correctly', [0])
    //CALL apoc.util.validate(NOT(exists(u.primaryOrganization)), 'The calling User is not configured correctly', [0])
    CALL apoc.util.validate(u.primaryOrganization IS NULL, 'The calling User is not configured correctly', [0]) 
    CREATE (key:APIKey {id: apoc.create.uuid(), key: $key})
    WITH u,key
    CALL apoc.create.addLabels([key], [$org]) YIELD node as dbConnectionNode
    `
    ;
  query = duration
    ? query + `SET key.expirationDate = date() + Duration({days: $duration})`
    : query + `SET key.expirationDate = 'none'`;
  query = query + "RETURN key";
  // write the key to the database
  const result = await runQuery({
    query,
    args: {
      email,
      org,
      duration,
      key: encrypt(key),
    },
    driver: getDriver(),
    database: process.env.NEO4J_DATABASE,
  });
  // if the user has insufficient permissions thow an error
  if (!Array.isArray(result.records) || result.records.length === 0)
    throw new Error(
      "Failed to create api key. You may not have sufficient privileges."
    );
  // unpack and return the api key
  const keyObject = result.records[0].get("key").properties;
  return {
    id: keyObject.id,
    key: decrypt(keyObject.key),
    expirationDate: keyObject.expirationDate,
  };
};

export const createAPIKey = async (duration, { email }) => {
  const transactionId = uuidv4();  
  const apiCallName = "createAPIKey";
  try {
    // create a new API and check if it exists in the database
  let key = makeKey(24);
  let keyExists = await getAPIKey(key);
  // regenerate a new key if the old one already exists
  while (keyExists) {
    key = makeKey(24);
    keyExists = await getAPIKey(key);
  }
  // build the query to write the key, include an expirationDate if specified
  let query = `
    MATCH (u:User:Admin {email: $email})
    WHERE u.primaryOrganization IS NOT NULL
    //CALL apoc.util.validate(NOT(exists(u.primaryOrganization)), 'The calling User is not configured correctly', [0])
    CALL apoc.util.validate(u.primaryOrganization IS NULL, 'The calling User is not configured correctly', [0])
    CREATE (key:APIKey {id: apoc.create.uuid(), key: $key})
    WITH u,key
    CALL apoc.create.addLabels([key], [u.primaryOrganization]) YIELD node as dbConnectionNode
    `
    ;
  query = duration
    ? query + `SET key.expirationDate = date() + Duration({days: $duration})`
    : query + `SET key.expirationDate = 'none'`;
  query = query + "RETURN key";

  // Log that the API call has been initiated
  logger.info(`Transaction ID: ${transactionId} - API: ${apiCallName} - User with email ${email} is creating an API key`);

  // write the key to the database
  const result = await runQuery({
    query,
    args: {
      email,
      duration,
      key: encrypt(key),
    },
    driver: getDriver(),
    database: process.env.NEO4J_DATABASE,
  });
  // if the user has insufficient permissions thow an error
  if (!Array.isArray(result.records) || result.records.length === 0) {
    throw new Error(
      "Failed to update api key. You may not have sufficient privileges."
    );
  }
  // unpack and return the api key
  const keyObject = result.records[0].get("key").properties;
  if (keyObject) {
    logger.info(`Transaction ID: ${transactionId} - API: ${apiCallName} - User with email ${email} created an API key having ID ${keyObject.id} and expiration date  ${keyObject.expirationDate} `);
    return {
      id: keyObject.id,
      key: decrypt(keyObject.key),
      expirationDate: keyObject.expirationDate,
    };
  }
} catch(error) {
    logger.error(`Transaction ID: ${transactionId} -  API: ${apiCallName} - User with email ${email}: ${error.message}`);
    throw error;  // Rethrow the error after logging
  }  
};

export const updateAPIKey = async (key, duration, { email }) => {

  const transactionId = uuidv4();  
  const apiCallName = "updateAPIKey";
  try {
    // get the api key if it exists
  const keyObject = await getAPIKey(key);
  if (!keyObject) throw new Error("The provided api key could not be found.");
  // match on the id and update the duration
  const query = `
    MATCH (u:User:Admin {email: $email})
    MATCH (key:APIKey {id: $id})
    WHERE u.primaryOrganization IS NOT NULL  AND u.primaryOrganization IN labels(key) 
    //CALL apoc.util.validate(NOT(exists(u.primaryOrganization)), 'The calling User is not configured correctly', [0])
    CALL apoc.util.validate(u.primaryOrganization IS NULL, 'The calling User is not configured correctly', [0])
    SET key.expirationDate = date() + Duration({days: $duration})
    RETURN key
  `;

   // Log that the API call has been initiated
   logger.info(`Transaction ID: ${transactionId} - API: ${apiCallName} - User with email ${email} is updating an API key`);

  const result = await runQuery({
    query,
    args: {
      email,
      duration,
      id: keyObject.id,
    },
    driver: getDriver(),
    database: process.env.NEO4J_DATABASE,
  });
  // if the user has insufficient permissions thow an error
  if (!Array.isArray(result.records) || result.records.length === 0) {
    throw new Error(
      "Failed to update api key. You may not have sufficient privileges."
    );
  }
  // return updated key record
  const updatedKeyObject = result.records[0].get("key").properties;
  if (updatedKeyObject) {
    logger.info(`Transaction ID: ${transactionId} - API: ${apiCallName} - User with email ${email} updated an API key having ID ${updatedKeyObject.id} and expiration date  ${updatedKeyObject.expirationDate} `);
    return {
      id: updatedKeyObject.id,
      key: decrypt(updatedKeyObject.key),
      expirationDate: updatedKeyObject.expirationDate,
    };
  }
  } catch(error) {
    logger.error(`Transaction ID: ${transactionId} -  API: ${apiCallName} - User with email ${email}: ${error.message}`);
    throw error;
  }
};

// Helper to check if a key already exists in the database
const getAPIKey = async (key) => {
  const result = await runQuery({
    driver: getDriver(),
    database: process.env.NEO4J_DATABASE,
    query: "MATCH (key:APIKey) RETURN key",
  });
  if (!Array.isArray(result.records))
    throw new Error("Failed to create api key.");
  for (let i = 0; i < result.records.length; i++) {
    const keyObject = result.records[i].get("key").properties;
    if (key === decrypt(keyObject.key)) return keyObject;
  }
  return false;
};

// Key generation function found on stack overflow
// https://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
const makeKey = (length) => {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};
