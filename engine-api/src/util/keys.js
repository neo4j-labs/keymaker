var LRU = require("lru-cache");
import { decrypt, encrypt } from "./encryption/crypto";
import { runQuery, validateQueryResult, getDriver } from "./db";
import { logger } from "../index";

const ERROR_MESSAGE = "API key not found, it may have expired. If you have not received an API key or beleive yours has expired please contact your Neo4j administrator."

/* Global variables used by the LRU cache */
const MAX_CACHED_APIKEYS = parseInt(process.env.MAX_CACHED_APIKEYS)
  ? parseInt(process.env.MAX_CACHED_APIKEYS)
  : 100; // number of api keys allowed in the cache - default: 100
const APIKEY_CACHE_PRUNE_INTERVAL = parseInt(
  process.env.APIKEY_CACHE_PRUNE_INTERVAL
)
  ? parseInt(process.env.APIKEY_CACHE_PRUNE_INTERVAL)
  : 600000; // how often the cache should be pruned - default: 10 min
const APIKEY_CACHE_RESET_INTERVAL = parseInt(
  process.env.APIKEY_CACHE_RESET_INTERVAL
)
  ? parseInt(process.env.APIKEY_CACHE_RESET_INTERVAL)
  : 86400000; // how often the cache should be reset - default: 1 day

/* LRU setup */
const cacheOptions = {
  max: MAX_CACHED_APIKEYS,
};
const cache = new LRU(cacheOptions);

/* Periodically prune the cache of expired keys */
setInterval(() => {
  cache.prune();
}, APIKEY_CACHE_PRUNE_INTERVAL);

/* Periodically reset the cache in the event a key was deleted or the expriation date was reduced */
setInterval(() => {
  cache.reset();
}, APIKEY_CACHE_RESET_INTERVAL);

/* API key validation & cache management */
/* TODO: figure out how to store encrypted keys */
export const validateAPIKey = async (key) => {
    // check if the cache containes the api key
  if (cache.has(key)) {
    // get the key from the cache
    const cachedKeyObject = cache.get(key);
    // if the cached key is stale it will return undefined
    if (cachedKeyObject !== undefined) return cachedKeyObject.securityOrg;
  }
  // get all api keys from the database
  const result = await runQuery({
    driver: getDriver(),
    query: "MATCH (key:APIKey) RETURN key, head([x IN labels(key) WHERE NOT x = 'APIKey']) as securityOrg",
    args: { key: encrypt(key) },
    database: process.env.NEO4J_DATABASE,
  });
  // ensure we find some API keys
  validateQueryResult(result, ERROR_MESSAGE);
  // look for the given api and add it to the cache if found
  for (let i = 0; i < result.records.length; i++) {
    const record = result.records[i];
    const keyObject = record.get("key").properties;
    keyObject.securityOrg = record.get("securityOrg");
    if (key === decrypt(keyObject.key)) {
      // add the key to the cache with no maxAge if it has no expirationDate
      if (keyObject.expirationDate === "none") {
        cache.set(key, keyObject);
        return keyObject.securityOrg;
      }
      // get exiration date
      const expirationDate = new Date(keyObject.expirationDate);
      // throw an error if the key is expired 
      if (expirationDate < new Date()) {
        logger.error(`${apiCallName} - API key expired`);
        throw new Error(ERROR_MESSAGE); 
      }
      // add the key to the cache w/its maxAge set to its expirationDate
      cache.set(key, keyObject, expirationDate.getTime() - new Date());
      return keyObject.securityOrg;
    }
  }
  throw new Error(ERROR_MESSAGE);
};
