/* -- Main Pipeline Query Builders -- */

// cypher stub helpers
const QUERY_START = `
  WITH [] AS results
  CALL dbms.components() YIELD edition AS license 
  CALL apoc.util.validate(license = 'community', 'Cannot run Keymaker on a Neo4j community license', [license])
`;

const QUERY_END = (first, skip) => {
  return `
  UNWIND results AS result
  WITH result 
  ORDER BY result.score DESC
  RETURN collect(result)[${skip}..${skip + first}] AS results
`;
};

// serial pipeline query builder
export const buildPipelineQuery = (phases, first, skip) => {
  let query = QUERY_START;
  for (var i = 0; i < phases.length; i++) {
    query += queryBuilders[phases[i].phaseType](i, phases[i]);
    // query += queryBuilders[phases[i].phaseType](i, phases[i]);

  }
  query += QUERY_END(first, skip);
  return query;
};

// parallel pipeline query builder
export const _buildParallelPipelineQuery = (
  phases,
  first,
  skip,
  concurrency
) => {
  let query = QUERY_START;
  for (var i = 0; i < phases.length; i++) {
    let j = i;
    let arr = [];
    let flag = false;
    while (
      j < phases.length &&
      phases[j].phaseType === "CypherDiscoveryPhase"
    ) {
      arr.push(phases[j].cypherQuery);
      j++;
      flag = true;
    }
    if (flag === true) {
      query += cypherDiscoveryPhaseParallel(arr, concurrency);
      flag = false;
      i = j - 1;
    } else {
      query += queryBuilders[phases[i].phaseType](i, phases[i]);
    }
  }
  query += QUERY_END(first, skip);
  return query;
};

// parallel pipeline query with fallback to serial
export const buildParallelPipelineQuery = (
  phases,
  first,
  skip,
  concurrency
) => {
  const subQuery1 = buildPipelineQuery(phases, first, skip);
  const subQuery2 = _buildParallelPipelineQuery(
    phases,
    first,
    skip,
    concurrency
  );
  const query = `
    CALL apoc.help("mapParallel") YIELD name WITH collect(name) AS names
    CALL apoc.when(size(names) = 0, 
    ${JSON.stringify(subQuery1)}, 
    ${JSON.stringify(subQuery2)},
    {params: $params, phases: $phases}) YIELD value
    RETURN value.results AS results
  `;
  return query;
};

/* -- Collection Query Builders -- */

export const buildCollectionQuery = (phases) => {
  let query = `WITH {} AS map`;
  for (var i = 0; i < phases.length; i++) {
    query += queryBuilders[phases[i].phaseType](i, phases[i]);
  }
  query += `RETURN map`;
  return query;
};

export const _buildParallelCollectionQuery = (phases, concurrency) => {
  let query = `WITH {} AS map`;
  query += cypherCollectionPhaseParallel(
    phases.map((phase) => phase.cypherQuery),
    concurrency
  );
  query += `RETURN map`;
  return query;
};

export const buildParallelCollectionQuery = (phases, concurrency) => {
  const subQuery1 = buildCollectionQuery(phases);
  const subQuery2 = _buildParallelCollectionQuery(phases, concurrency);
  const query = `
    CALL apoc.help("mapParallel") YIELD name WITH collect(name) AS names
    CALL apoc.when(size(names) = 0, 
    ${JSON.stringify(subQuery1)}, 
    ${JSON.stringify(subQuery2)},
    {params: $params, phases: $phases}) YIELD value
    RETURN value.map AS map
  `;
  return query;
};

/* -- Phase Builders -- */

const cypherCollectionPhase = (i, _) => {
  return `
    //--collection phase--
    CALL apoc.cypher.run(
      $phases[${i}].cypherQuery+', $prevMap AS prevMap',
      apoc.map.merge($params, {prevMap: map})
    ) YIELD value
    WITH apoc.map.merge(value.map, value.prevMap) AS map
  `;
};

const cypherCollectionPhaseParallel = (arr, concurrency) => {
  return `
    //--collection phase parallel--
    CALL apoc.cypher.mapParallel('CALL apoc.cypher.run(_, $params) YIELD value RETURN value', {params: $params, parallel: True, concurrency: ${concurrency}}, ${JSON.stringify(
    arr
  )}) YIELD value
    WITH apoc.map.mergeList(collect(value.value.map)) AS map
  `;
};

const cypherDiscoveryPhase = (i, _) => {
  return `
    //--discovery phase--
    CALL apoc.cypher.run(
      $phases[${i}].cypherQuery+' UNION ALL UNWIND $prevResults AS value RETURN value.item AS item, value.score AS score, value.details as details',
      apoc.map.merge($params, { prevResults: results })
    ) YIELD value
    WITH DISTINCT value.item as item, value.score as score, value.details as detailsMap
    WITH item,  sum(score) as score,  apoc.map.mergeList(collect(detailsMap)) as details
    WITH {item: item, score: score, details: details} AS result
    WITH collect(result) AS results
  `;
};

const cypherDiscoveryPhaseParallel = (arr, concurrency) => {
  return `
    //--discovery phase parallel--
    CALL apoc.cypher.mapParallel(
      'CALL apoc.cypher.run(_, $params) YIELD value RETURN value AS results, $params.prevResults AS prevResults',
      {params: apoc.map.merge($params, { prevResults: results }), parallel: True, concurrency: ${concurrency}}, ${JSON.stringify(
    arr
  )}) YIELD value
    WITH value.results AS results, value.prevResults AS prevResults
    WITH prevResults, collect(results) as collectResults
    WITH collectResults + prevResults AS results
    UNWIND results AS result
    //keymaker 5.0 cypher syntax change

    WITH result.item as item, sum(result.score) as score, apoc.map.mergeList(collect(result.details)) as detailsMap

    WITH {item: item, score: score, details: detailsMap} AS mergedRecord
    WITH collect(mergedRecord) AS results 
  `;
};

const cypherBoostPhase = (i, _) => {
  return `
    //--boost phase--
    CALL apoc.cypher.run(
      'UNWIND $results AS result WITH result.item AS this, result.score as _score, result.details AS _details ' + $phases[${i}].cypherQuery
      +' UNION ALL UNWIND $prevResults AS value RETURN value.item AS item, value.score AS score, value.details as details',
      apoc.map.merge($params, {results: results, prevResults: results})
    ) YIELD value

    //keymaker 5.0 cypher syntax change

    WITH value.item as item, sum(value.score) as score, apoc.map.mergeList(collect(value.details)) as detailsMap

    WITH {item: item, score: score, details: detailsMap} AS result
    WITH collect(result) AS results
  `;
};

// -- Pending --
// const cypherBoostPhaseParallel = (i, _) => {
//   return `
//     //--boost phase--
//       CALL apoc.cypher.mapParallel2("WITH _ as
//       $phases[${i}].cypherQuery",{$params},{results})
//     ) YIELD value
//     UNION ALL UNWIND $prevResults AS value RETURN value.item AS item, value.score AS score, value.details as details
//     WITH {item:value.item, score:sum(value.score), details:apoc.map.mergeList(collect(value.details))} AS result
//     WITH collect(result) AS results
//   `;
// };

const cypherExcludePhase = (i, phase) => {
  const invert = phase.inverted ? "" : " NOT";
  return `
    //--exclude phase--
    WITH [result IN results WHERE 
      apoc.cypher.runFirstColumnSingle(
        'WITH $item AS this, $score as _score, $details AS _details '+$phases[${i}].cypherQuery,
        apoc.map.merge($params, {item:result.item, score:result.score, details:result.details})
      ) IS${invert} null 
    | result] AS results
  `;
};

const cypherDiversityPhase = (i, _) => {
  return `
    //--diversity phase--
    UNWIND results AS result
    WITH result, result.score AS score
    ORDER BY score DESC
    WITH apoc.cypher.runFirstColumnSingle(
      'WITH $item AS this,  $score as _score, $details AS _details '+$phases[${i}].cypherQuery,
        apoc.map.merge($params, {item:result.item, score:result.score, details:result.details})
    ) AS attribute, collect(result)[0..$phases[${i}].maxAmount] AS topScoringPerAttribute
    WITH apoc.coll.flatten(collect(topScoringPerAttribute)) AS results
  `;
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
