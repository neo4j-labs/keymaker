/* -- Main Pipeline Query Builders -- */

// cypher stub helpers
const QUERY_START = `
  WITH [] AS results
  CALL dbms.components() YIELD edition AS license 
  CALL apoc.util.validate(license = 'community', 'Cannot run Keymaker on a Neo4j community license', [license])
`;

// cypher stub helpers
const PARALLEL_RUNTIME_QUERY_START = 
  `cypher runtime=parallel
  WITH [] AS results
  CALL dbms.components() YIELD edition AS license 
  CALL apoc.util.validate(license = 'community', 'Cannot run Keymaker on a Neo4j community license', [license])
`;

const QUERY_END = (first, skip) => {
  return `
  UNWIND results AS result
  WITH result 
  ORDER BY result.score DESC 
  WITH DISTINCT result.item as item, toInteger(result.score) as score, result.details as details
  WITH {item:item, score:score, details: details} as result
  RETURN collect(result)[${skip}..${skip + first}] AS results
`;
};

// serial pipeline query builder
export const buildPipelineQuery = (phases, first, skip, isParallelRuntimeEnabled) => {
  let query = isParallelRuntimeEnabled ? PARALLEL_RUNTIME_QUERY_START : QUERY_START;
  for (var i = 0; i < phases.length; i++) {
    query += queryBuilders[phases[i].phaseType](i, phases[i]);
  }
  query += QUERY_END(first, skip);
  return query;
};

/* -- Collection Query Builders -- */

export const buildCollectionQuery = (phases, isParallelRuntimeEnabled) => {
  // Initialize the query based on the isParallelRuntimeEnabled flag
  let query = isParallelRuntimeEnabled
  ? `cypher runtime=parallel WITH {} AS prevMap`
  : `WITH {} AS prevMap`;
  for (var i = 0; i < phases.length; i++) {
    query += queryBuilders[phases[i].phaseType](i, phases[i]);
  }
  query += `RETURN prevMap`;
  return query;
};

const cypherCollectionPhase = (i, phase) => {
  return `
    //--collection phase--
    WITH prevMap
    CALL {
      ${phase.cypherQuery}
    }
    WITH apoc.map.merge(map, prevMap) AS prevMap
  `;
};

const cypherDiscoveryPhase = (i, phase) => {
  return `
      //-- Phase ${i + 1}: Discovery Phase --
      CALL {
        WITH results
        WITH results as prevResults
        UNWIND prevResults AS value
        RETURN value.item AS item, value.score AS score, value.details AS details
        UNION ALL
        ${phase.cypherQuery}
      }
      WITH DISTINCT item, score, details
      WITH item, sum(score) AS score, apoc.map.mergeList(collect(details)) AS details
      WITH {item: item, score: score, details: details} AS result
      WITH collect(result) AS results
  `;
};

const cypherBoostPhase = (i, phase) => {
  return `
    //--boost phase--
    CALL {
      WITH results 
      WITH results AS prevResults
      UNWIND prevResults AS result
      WITH result.item AS this, result.score AS _score, result.details AS _details, prevResults
      ${phase.cypherQuery}
      UNION ALL
      WITH results
      UNWIND results AS value
      RETURN value.item AS item, value.score AS score, value.details AS details

    }
    WITH item, score, details
    WITH DISTINCT item, sum(score) AS score, apoc.map.mergeList(collect(details)) AS details
    WITH {item: item, score: score, details: details} AS result
    WITH collect(result) AS results
  `;
};

const cypherExcludePhase = (i, phase) => {
  const invert = phase.inverted ? "NOT" : "";
  return `
    //--exclude phase--
    UNWIND results as result
    WITH result.item AS this, result.score AS _score, result.details AS _details, result
    WHERE ${invert} EXISTS {
    WITH this, _score, _details
    ${phase.cypherQuery}
    }
    WITH collect(result) AS results
  `;
};

const cypherDiversityPhase = (i, phase) => {
  return `
    //--diversity phase--
    UNWIND results AS result
    WITH result.item as item, result.score AS score, result.details as details, result
    CALL {
    WITH item,score, details
    WITH item as this, score as _score, details as _details
    ${phase.cypherQuery}
    }
    // Merge the attribute back into the result
    WITH apoc.map.merge(result, {attribute: attribute}) AS resultWithAttribute
    ORDER BY resultWithAttribute.attribute, resultWithAttribute.score DESC

    // Collect results per attribute
    WITH resultWithAttribute.attribute AS attribute, collect(resultWithAttribute) AS resultsPerAttribute

    // Limit results per attribute
    WITH attribute, resultsPerAttribute[0..${phase.maxAmount}] AS limitedResultsPerAttribute

    // Collect all limited results into a single list
    WITH collect(limitedResultsPerAttribute) AS listOfLists

    // Flatten the list of lists into a single list of results
    WITH apoc.coll.flatten(listOfLists) AS results`;
};

/* 
  TODO: find a better way to carry over prevResults in the event of an 'UNWIND' 
  without using 'LIMIT 1'.
*/
const cypherWritePhase = (i, _) => {
  return `
    //--write phase--
    CALL apoc.cypher.doIt(
      $phases[${i}].cypherQuery+' RETURN $prevResults AS prevResults',
      apoc.map.merge($params, { prevResults: results })
    ) YIELD value
    WITH value.prevResults AS results LIMIT 1
  `;
};

const gdsCreatePhase = (i, _) => {
  return `
    //--gds create phase--
    CALL apoc.cypher.run(
      $phases[${i}].cypherQuery+' RETURN $prevResults AS prevResults',
      apoc.map.merge($params, { prevResults: results })
    ) YIELD value
    WITH value.prevResults AS results LIMIT 1
  `;
};

const gdsWritePhase = (i, _) => {
  return `
    //--gds write phase--
    CALL apoc.cypher.doIt(
      $phases[${i}].cypherQuery+' RETURN $prevResults AS prevResults',
      apoc.map.merge($params, { prevResults: results })
    ) YIELD value
    WITH value.prevResults AS results LIMIT 1
  `;
};

const gdsDropPhase = (i, _) => {
  return `
    //--gds drop phase--
    CALL apoc.cypher.run(
      $phases[${i}].cypherQuery+' RETURN $prevResults AS prevResults',
      apoc.map.merge($params, { prevResults: results })
    ) YIELD value
    WITH value.prevResults AS results LIMIT 1
  `;
};

const queryBuilders = {
  CypherDiscoveryPhase: cypherDiscoveryPhase,
  CypherBoostPhase: cypherBoostPhase,
  CypherExcludePhase: cypherExcludePhase,
  CypherDiversityPhase: cypherDiversityPhase,
  CypherCollectionPhase: cypherCollectionPhase,
  CypherWritePhase: cypherWritePhase,
  GDSCreatePhase: gdsCreatePhase,
  GDSWritePhase: gdsWritePhase,
  GDSDropPhase: gdsDropPhase,
  // Neo4j: cypherDiscoveryPhase
};
