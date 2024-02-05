var LRU = require("lru-cache");
import neo4j from "neo4j-driver";
import packageInfo from "../../package.json";
import { decrypt } from "./encryption/crypto";

/* Global variables used by the LRU cache & neo4j driver */
const MAX_CACHED_DRIVERS = parseInt(process.env.MAX_CACHED_DRIVERS)
  ? parseInt(process.env.MAX_CACHED_DRIVERS)
  : 100; // number of drivers allowed in the cache - default: 100
const MAX_DRIVER_AGE = parseInt(process.env.MAX_DRIVER_AGE)
  ? parseInt(process.env.MAX_DRIVER_AGE)
  : 3600000; // lifespan of an unused driver in the cache - default: 60 min
const NEO4J_TRANSACTION_TIMEOUT = parseInt(
  process.env.NEO4J_TRANSACTION_TIMEOUT
)
  ? parseInt(process.env.NEO4J_TRANSACTION_TIMEOUT)
  : 300000; // tx timeout controlled by the neo4j driver - default: 5 min
const DRIVER_CACHE_PRUNE_INTERVAL = parseInt(
  process.env.DRIVER_CACHE_PRUNE_INTERVAL
)
  ? parseInt(process.env.DRIVER_CACHE_PRUNE_INTERVAL)
  : 600000; // how often the cache should be pruned - default: 10 min

/* LRU setup */
const driverCacheOptions = {
  max: MAX_CACHED_DRIVERS,
  dispose: (key, n) => {
    closeDriver(n, key);
  },
  maxAge: MAX_DRIVER_AGE,
};
const driverCache = new LRU(driverCacheOptions);

const dbConnectionCacheOptions = {
  max: MAX_CACHED_DRIVERS,
  maxAge: MAX_DRIVER_AGE,
};
const dbConnectionCache = new LRU(dbConnectionCacheOptions);

/* Periodically prune the driverCache of old/unused drivers */
setInterval(() => {
  driverCache.prune();
  dbConnectionCache.prune();
}, DRIVER_CACHE_PRUNE_INTERVAL);

/* Driver initialization & cache management */
export const initializeDriver = ({
  dbConnection,
  credentialsEncrypted = true,
}) => {
  let driver;
  const { id, url, user, password } = dbConnection;
  // check if the driverCache containes the driver id
  if (driverCache.has(id)) {
    // find the drivers corresponding dbConnection
    if (dbConnectionCache.has(id)) {
      const cachedDBConnection = dbConnectionCache.get(id);
      // if the cached connection differs from the given connection we can't used the cached driver
      if (dbConnectionsMatch(dbConnection, cachedDBConnection)) {
        // get the driver from the driverCache
        driver = driverCache.get(id);
        // if the drivers age exceeds MAX_DRIVER_AGE it will be undefined
        if (driver !== undefined) return driver;
      }
    }
  }
  // create a new driver as the driverCache did not contain one
  driver = neo4j.driver(
    url,
    credentialsEncrypted
      ? neo4j.auth.basic(decrypt(user), decrypt(password))
      : neo4j.auth.basic(user, password),
    {
      disableLosslessIntegers: true,
      userAgent: `neo4j-keymaker-admin-api-execution/v${packageInfo.version}`,
    }
  );
  // add the driver to the driverCache
  driverCache.set(id, driver);
  // add the db to the dbConnectionCache
  dbConnectionCache.set(id, dbConnection);
  // return the driver to be used by the calling function
  return driver;
};

/* Query excecution */
export const runQuery = async ({
  driver,
  query,
  args = {},
  isRead = false,
  allowTimeout = true,
  database = "default",
}) => {
  let session;
  // determine access mode i.e. write queries -> leader, read queries -> any cluster member
  const accessMode = isRead ? neo4j.session.READ : neo4j.session.WRITE;
  // run query against the default db if no database name is provided
  if (database === "default" || database === undefined) {
    session = driver.session({ defaultAccessMode: accessMode });
  } else {
    session = driver.session({
      database: database,
      defaultAccessMode: accessMode,
    });
  }
  // set tx config for query timeout
  const txConfig = allowTimeout ? { timeout: NEO4J_TRANSACTION_TIMEOUT } : {};
  // run query, close session & return results
  const result = await session.run(query, args, txConfig);
  session.close();
  return result;
};

var keymakerDriver
export const setDriver = (localDriver) => {
  keymakerDriver = localDriver;
}

export const getDriver = () => {
  return keymakerDriver;
}

/* Keymaker driver init helper */
const initializeKeymakerDriver = () => {
  try {
        let driver = neo4j.driver(
      process.env.NEO4J_URI,
      neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD),
      { disableLosslessIntegers: true }
          );
    return driver;
  } catch (error) {
    console.log(error);
    return null;
  }
};

// export const KEYMAKER_DRIVER = initializeKeymakerDriver();

/* Cypher Workbench driver init helper */
const initializeCypherWorkbenchDriver = () => {
  try {
    let driver = neo4j.driver(
      process.env.CW_NEO4J_URI,
      neo4j.auth.basic(process.env.CW_NEO4J_USER, process.env.CW_NEO4J_PASSWORD),
      { disableLosslessIntegers: true }
    );
    return driver;
  } catch (error) {
    return null;
  }
};

export const CYPHER_WORKBENCH_DRIVER = initializeCypherWorkbenchDriver();

/* Throws the given error if we get an unexpected query result */
export const validateQueryResult = (result, error) => {
  // if result is undefined
  if (!result) throw new Error(error);
  // if result.records is not an array
  if (!Array.isArray(result.records)) throw new Error(error);
  // if there are no records returned
  if (result.records.length === 0) throw new Error(error);
};

/* Driver close function called when a driver is removed from the driverCache */
const closeDriver = (driver, id) => {
  try {
    driver.close();
  } catch (e) {
    console.log(`Error closing driver id ${id}`, e);
  }
};

const dbConnectionsMatch = (c1, c2) => {
  if (!c1 || !c2) return false;
  if (c1.url === c2.url && c1.password === c2.password && c1.user === c2.user) {
    return true;
  }
  return false;
};
