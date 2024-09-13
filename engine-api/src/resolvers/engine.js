import {
  runBatchEngine,
  getEngineResults,
  getEnginePerformanceResults,
  cancelBatchEngine,
  isBatchEngineRunning,
} from "../execution/engine";
var LRU = require("lru-cache");
import { performance } from "perf_hooks";
import { findEngineByID, findPhasesByID } from "../models/engine";
import { Console } from "console";
import { logger } from "../index";
import { v4 as uuidv4 } from 'uuid';

export default {
  Query: {
    /* primary analytics endpoint */
    runEngine: async (root, args, context, info) => {
      return await _runEngine(root, args, context, info);
    },
    /* performance testing endpoint */
    runEnginePerformance: async (root, args, context, info) => {
      return await _runEnginePerformance(root, args, context, info);
    },
    /* batch engine start */
    runBatchEngine: async (root, args, context, info) => {
      const engine = await findEngineByID(args.engineID, context);
      try {
        return await runBatchEngine(
          engine,
          args.params,
          args.delaySeconds,
          args.timeIntervalSeconds
        );
      } catch (err) {
        throw err;
      }
    },
    /* validate batch engine */
    isBatchEngineRunning: async (root, args, context, info) => {
      const engine = await findEngineByID(args.engineID, context);
      try {
        return await isBatchEngineRunning(engine);
      } catch (err) {
        throw err;
      }
    },
    /* batch engine stop */
    cancelBatchEngine: async (root, args, context, info) => {
      const engine = await findEngineByID(args.engineID, context);
      try {
        return await cancelBatchEngine(engine);
      } catch (err) {
        throw err;
      }
    },
    /* Update the engine engineCache when an engine is edited or deleted */
    updateEngineCache: async (root, args, context, info) => {
      const { id, updateByDependency } = args;
      if (updateByDependency) {
        // if a phase or dbConnection was updated add the id to the dependency cache
        dependencyCache.set(id, true);
      } else {
        engineCache.del(id); // remove engine from the engineCache
        getEngine({ id, useCache: true }, context); // re-run caching function to refresh
      }
    },
    /* DEPRECIATED: endpoint kept for backwards compatability */
    recommendations: async (root, args, context, info) => {
      return await _runEngine(root, args, context, info);
    },
    /* DEPRECIATED: endpoint kept for backwards compatability */
    recommendationsForPhases: async (root, args, context, info) => {
      args = { phaseIDs: args.phaseID, ...args };
      return await _runEngine(root, args, context, info);
    },
    /* DEPRECIATED: endpoint kept for backwards compatability */
    recommendationPerformance: async (root, args, context, info) => {
      return await _runEnginePerformance(root, args, context, info);
    },
  },
};

/* 
  Run engine logic used by the runEngine endpoint and the 
  depreciated recommendations endpoint 
*/
const _runEngine = async (root, args, context, info) => {
  // Generate a unique transaction ID for this API call
  const transactionId = uuidv4();  
  const apiCallName = "_runEngine";

  const engine = await getEngine(args, context);
  console.log("engine info", engine)
  try {
    logger.info(`Transaction ID: ${transactionId} - API: ${apiCallName} - Engine - "${engine.id}" execution initiated`);
    const startTime = Date.now();  // Capture the start time
    const results = await getEngineResults(
      engine,
      args.params,
      args.first,
      args.skip,
      args.parallel,
      args.concurrency
    );
    const elapsedTime = Date.now() - startTime;  
    logger.info(`Transaction ID: ${transactionId} - API: ${apiCallName} - Results retrieved for Engine - "${engine.id}". Elapsed time: ${elapsedTime} ms`);
    return results;
  } catch (error) {
    logger.info(`Transaction ID: ${transactionId} - API: ${apiCallName} - Engine execution failed for Engine - "${engine.id}".: ${error.message}`);
    throw error;
  }
};

/* 
  Engine perf logic used by the runEnginePerformance endpoint and the depreciated 
  recommendationPerformance endpoint 
*/
const _runEnginePerformance = async (root, args, context, info) => {
  const engine = await getEngine(args, context);
  const sleep = (milliseconds) => {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  };
  // function to call analytics endpoint
  const runEngine = async (i) => {
    const startTime = performance.now();
    const result = await getEnginePerformanceResults(
      engine,
      args.params,
      args.first,
      args.skip,
      args.parallel,
      args.concurrency
    );

    const elapsedTime = performance.now() - startTime;
    return {
      id: i,
      responseTime: result.endnow,
      packagingTime: elapsedTime - result.endnow,
      totaltime: elapsedTime
    };
  };
  // generate array of async requests
  let promises = [];
  for (let i = 0; i < args.numUsers; i++) {
    await sleep(args.sleep);
    promises.push(runEngine(i));
  }
  // excecute all promises
  const durations = await Promise.all(promises);
  return {
    durations,
    avgDuration:
      durations.reduce((total, duration) => total + duration.totaltime, 0) /
      durations.length,
    maxDuration: durations.reduce(
      (max, duration) => (duration.totaltime > max ? duration.totaltime : max),
      durations[0].totaltime
    ),
    minDuration: durations.reduce(
      (min, duration) => (duration.totaltime < min ? duration.totaltime : min),
      durations[0].totaltime
    ),
    numUsers: args.numUsers,
    timeBetweenCalls: args.sleep,
  };
};

/* Global variables used by the LRU cache */
const MAX_CACHED_ENGINES = parseInt(process.env.MAX_CACHED_ENGINES)
  ? parseInt(process.env.MAX_CACHED_ENGINES)
  : 100; // number of api keys allowed in the cache - default: 100
const MAX_ENGINE_AGE = parseInt(process.env.MAX_ENGINE_AGE)
  ? parseInt(process.env.MAX_ENGINE_AGE)
  : 3600000; // how often the cache should be pruned - default: 60 min
const ENGINE_CACHE_PRUNE_INTERVAL = parseInt(
  process.env.ENGINE_CACHE_PRUNE_INTERVAL
)
  ? parseInt(process.env.ENGINE_CACHE_PRUNE_INTERVAL)
  : 600000; // how often the cache should be pruned - default: 10 min
const ENGINE_CACHE_RESET_INTERVAL = parseInt(
  process.env.ENGINE_CACHE_RESET_INTERVAL
)
  ? parseInt(process.env.ENGINE_CACHE_RESET_INTERVAL)
  : 86400000; // how often both caches should be reset - default: 1 day

/* LRU setup */
const cacheOptions = {
  max: MAX_CACHED_ENGINES,
  maxAge: MAX_ENGINE_AGE,
};
const engineCache = new LRU(cacheOptions);
const dependencyCache = new LRU(); // cache to hold all engine dependencies (i.e. phases & dbConnections)

/* Periodically prune the cache of old engines */
setInterval(() => {
  engineCache.prune();
}, ENGINE_CACHE_PRUNE_INTERVAL);

/* Periodically prune the cache of old engines */
setInterval(() => {
  engineCache.reset();
  dependencyCache.reset();
}, ENGINE_CACHE_RESET_INTERVAL);

/*
  Engine caching function
*/
// TODO: figure out how to cache requests for specific phases
const getEngine = async (args, context) => {
  var { engineID, phaseIDs, useCache } = args;
  // determine if we want to run the entire engine or specific phases
  const runPhases = Array.isArray(phaseIDs) && phaseIDs.length > 0;
  if (useCache && !runPhases && engineCache.has(engineID)) {
    // get the engine from the engineCache
    const cachedEngine = engineCache.get(engineID);
    // check if the engine has a stale dependency
    let dependencyFlag = false;
    if (dependencyCache.has(cachedEngine.dbConnection.id)) {
      dependencyFlag = true;
    }
    for (let i = 0; i < cachedEngine.phases.length; i++) {
      if (dependencyCache.has(cachedEngine.phases[i].id)) {
        dependencyFlag = true;
      }
    }
    // if the cache contains a valid engine return it
    if (cachedEngine && !dependencyFlag) return cachedEngine;
  }
  // get the engine from the database
  const engine = runPhases
    ? await findPhasesByID(phaseIDs, context)
    : await findEngineByID(engineID, context);
  // any calls that include specific phase IDs will not be cached
  if (!runPhases) engineCache.set(engineID, engine);
  return engine;
};
