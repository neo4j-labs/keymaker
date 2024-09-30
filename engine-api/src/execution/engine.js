import {
  buildPipelineQuery,
  buildCollectionQuery
} from "../util/query.js";
import { performance } from "perf_hooks";
import { initializeDriver, runQuery } from "../util/db.js";

export const getEngineResults = async (
  engine,
  params,
  first,
  skip,
  parallel,
  concurrency
) => {
  const { returnProperties, phases, dbConnection, databaseName } = engine;
  try {
    //Check if parallel runtime is enabled for engine and db connection
    // console.log("Engine Check", engine.isParallelRuntimeEnabled, "DB check" , dbConnection.isParallelRuntimeEnabled)
    let isRead = false;
    let allParams = params;
    let isParallelRuntimeEnabled = (dbConnection.isParallelRuntimeEnabled && engine.isParallelRuntimeEnabled) || false
    // console.log("isParallelRuntimeEnabled - ", isParallelRuntimeEnabled)
    const driver = initializeDriver({ dbConnection });
    const activePhases = phases.filter((phase) => phase.active);
    // set is read flag
    for (let i = 0; i < activePhases.length; i++) {
      if (
        activePhases[i].phaseType === "GDSWritePhase" ||
        activePhases[i].phaseType === "CypherWritePhase"
      ) {
        // turn off parallel if there is any writing
        isRead = false;
        parallel = false;
        break;
      }
      isRead = true;
    }
    // build the collection query
    const collectionPhases = activePhases.filter(
      (phase) => phase.phaseType === "CypherCollectionPhase"
    );
    if (collectionPhases.length !== 0) {
      const collectionQuery = buildCollectionQuery(collectionPhases, isParallelRuntimeEnabled);
      let res = await runQuery({
        driver,
        isRead: true,
        query: collectionQuery,
        args: {
          // params,
          ...params,
          phases: collectionPhases,
        },
        database: databaseName,
      });
      allParams = {
        ...params,
        ...res.records[0].get("prevMap"),
      };
    }
    // build the main pipeline query
    const pipelinePhases = activePhases.filter(
      (phase) => phase.phaseType !== "CypherCollectionPhase"
    );
    const pipelineQuery = buildPipelineQuery(pipelinePhases, first, skip, isParallelRuntimeEnabled);
    // console.log("Pipeline Query - ", pipelineQuery,"Params : ",allParams)    // print the complied query
    let results = await runQuery({
      driver,
      isRead,
      query: pipelineQuery,
      args: {
        // params: allParams,
        ...allParams,
        phases: pipelinePhases,
      },
      database: databaseName,
    }).then((result) => {
      return result.records[0].get("results").map((result) => {
        // get only the specified engine return properties
        const properties = {};
        returnProperties.forEach((property) => {
          if (property in result.item.properties) {
            properties[property] = result.item.properties[property];
          }
        });
        return {
          item: properties,
          score: result.score,
          details: result.details,
        };
      });
    });
    return results;
  } catch (err) {
    throw err;
  }
};

export const getEnginePerformanceResults = async (
  engine,
  params,
  first,
  skip,
  parallel,
  concurrency
) => {
  const { returnProperties, phases, dbConnection, databaseName } = engine;
  try {
    let isRead = false;
    let allParams = params;
    let isParallelRuntimeEnabled = (dbConnection.isParallelRuntimeEnabled && engine.isParallelRuntimeEnabled) || false
    const driver = initializeDriver({ dbConnection });
    const activePhases = phases.filter((phase) => phase.active);
    // set is read flag
    for (let i = 0; i < activePhases.length; i++) {
      if (
        activePhases[i].phaseType === "GDSWritePhase" ||
        activePhases[i].phaseType === "CypherWritePhase"
      ) {
        // turn off parallel if there is any writing
        isRead = false;
        parallel = false;
        break;
      }
      isRead = true;
    }
    // build the collection query
    const collectionPhases = activePhases.filter(
      (phase) => phase.phaseType === "CypherCollectionPhase"
    );
    if (collectionPhases.length !== 0) {
      const collectionQuery = buildCollectionQuery(collectionPhases, isParallelRuntimeEnabled);
      let res = await runQuery({
        driver,
        isRead: true,
        query: collectionQuery,
        args: {
          // params,
          ...params,
          phases: collectionPhases,
        },
        database: databaseName,
      });
      allParams = {
        ...params,
        ...res.records[0].get("prevMap"),
      };
    }
    // build the main pipeline query
    const pipelinePhases = activePhases.filter(
      (phase) => phase.phaseType !== "CypherCollectionPhase"
    );
    const pipelineQuery = buildPipelineQuery(pipelinePhases, first, skip, isParallelRuntimeEnabled);
    // run the pipeline query
    let startnow = performance.now()
    let results = await runQuery({
      driver,
      isRead,
      query: pipelineQuery,
      args: {
        // params: allParams,
        ...allParams,
        phases: pipelinePhases,
      },
      database: databaseName,
    }).then((result) => {
      let endnow = performance.now() - startnow
      return {
        endnow: endnow,
        result: result.records[0].get("results").map((result) => {
          // get only the specified engine return properties
          const properties = {};
          returnProperties.forEach((property) => {
            if (property in result.item.properties) {
              properties[property] = result.item.properties[property];
            }
          });
          return {
            item: properties,
            score: result.score,
            details: result.details,
          };
        })
      };
    });
    return results;
  } catch (err) {
    throw err;
  }
};


export const runBatchEngine = async (
  engine,
  params,
  delaySeconds,
  timeIntervalSeconds
) => {
  const { phases, dbConnection, name, databaseName } = engine;
  try {
    const driver = initializeDriver({ dbConnection });
    const activePhases = phases.filter((phase) => phase.active);
    // filter for collection phases
    const collectionPhases = activePhases.filter(
      (phase) => phase.phaseType === "CypherCollectionPhase"
    );
    if (collectionPhases.length !== 0) {
      throw new Error("Collection phases are not supported in batch engines.");
    }
    // cancel any current jobs with the same name
    const cancelQuery = `
      CALL apoc.periodic.cancel("${name}")
    `;
    await runQuery({ driver, query: cancelQuery, database: databaseName });
    // build the main pipeline query
    const pipelinePhases = activePhases.filter(
      (phase) => phase.phaseType !== "CypherCollectionPhase"
    );
    const pipelineQuery = buildPipelineQuery(pipelinePhases, 0, 0);
    const batchQuery = `
      CALL apoc.util.sleep(${delaySeconds * 1000})
      CALL apoc.periodic.repeat("${name}", "${pipelineQuery}", ${timeIntervalSeconds}, {params: {phases: $phases, params: $params}}) YIELD name
      RETURN name
    `;
    // avoid using await as depending on the delay value this may take a long time to resolve
    runQuery({
      driver,
      query: batchQuery,
      args: {
        params,
        phases: pipelinePhases,
      },
      allowTimeout: false,
      database: databaseName,
    });
    return true;
  } catch (err) {
    throw err;
  }
};

export const isBatchEngineRunning = async (engine) => {
  const { dbConnection, name, databaseName } = engine;
  try {
    const driver = initializeDriver({ dbConnection });
    const query = `
      CALL apoc.periodic.list() YIELD name
      RETURN name
    `;
    const res = await runQuery({ driver, query, database: databaseName });
    const records = res.records ? res.records : [];
    let isRunning = records.map((r) => r.get("name")).includes(name);
    return isRunning;
  } catch (err) {
    throw err;
  }
};

export const cancelBatchEngine = async (engine) => {
  const { dbConnection, name, databaseName } = engine;
  try {
    const driver = initializeDriver({ dbConnection });
    const query = `
      CALL apoc.periodic.cancel($name) YIELD name
      RETURN name
    `;
    const res = await runQuery({
      driver,
      query,
      args: { name: name },
      database: databaseName,
    });
    const records = res.records ? res.records : [];
    const cancelName = records[0].get("name");
    return cancelName === name ? true : false;
  } catch (err) {
    throw err;
  }
};
