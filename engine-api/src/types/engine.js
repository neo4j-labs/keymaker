export default `

  type EngineResult {
    item: JSON
    score: Float
    details: JSON
  }

  type Query {
    runEngine(engineID: ID!, phaseIDs: [ID!] = [], params: JSON, first: Int = 20, skip: Int = 0, parallel: Boolean = true, concurrency: Int = 5, useCache: Boolean = true): [EngineResult]
    runEnginePerformance(engineID: ID!, params: JSON, first: Int = 20, skip: Int = 0, parallel: Boolean = true, concurrency: Int = 5, numUsers: Int = 1, sleep: Int = 500, useCache: Boolean = true): JSON
    runBatchEngine(engineID: ID!, timeIntervalSeconds: Int!, params: JSON, delaySeconds: Int = 0): Boolean
    isBatchEngineRunning(engineID: ID!): Boolean
    cancelBatchEngine(engineID: ID!): Boolean
    updateEngineCache(id: ID!, operation: String!, updateByDependency: Boolean = false): Boolean
    """
      DEPRECIATED: endpoints kept for backwards compatability
    """
    recommendations(engineID: ID!, phaseIDs: [ID!] = [], params: JSON, first: Int = 20, skip: Int = 0, parallel: Boolean = true, concurrency: Int = 5): [EngineResult]
    recommendationsForPhases(phaseID: [ID!]!, params: JSON, first: Int = 20, skip: Int = 0, parallel: Boolean = true, concurrency: Int = 5): [EngineResult]
    recommendationPerformance(engineID: ID!, params: JSON, first: Int = 20, skip: Int = 0, parallel: Boolean = true, concurrency: Int = 5, numUsers: Int = 1, sleep: Int = 500): JSON
  }
`;
