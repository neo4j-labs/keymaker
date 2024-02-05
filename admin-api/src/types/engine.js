export default `

  type Engine {
    id: ID!
    name: String!
    dataModel: ID
    createdAt: String!
    isPrivate: Boolean!
    description: String
    returnLabel: String
    returnProperties: [String]
    phases: [Phase]
    users: [UserRole]
    canCurrentUserEdit: Boolean
    canCurrentUserDelete: Boolean
    dbConnection: DBConnectionEx
    databaseName: String
  }

  input CreateEngineInput {
    id: ID!
    name: String!
    dataModel: ID
    dbConnectionID: ID!
    isPrivate: Boolean!
    description: String
    databaseName: String!
    returnLabel: String!
    returnProperties: [String]!
  }

  input EditEngineInput {
    name: String
    dataModel: ID
    isPrivate: Boolean
    description: String
    databaseName: String
    returnLabel: String
    returnProperties: [String]
  }

  input ImportEngineInput {
    id: ID!
    phases: [ImportPhaseInput]!
  }
  
  input ImportPhaseInput {
    id: ID!
    name: String!
    active: Boolean!
    phaseType: String!
    description: String!
    showCypher: Boolean!
    cypherQuery: String!
    inverted: Boolean
    maxAmount: Int
  }

  type Query {
    engine(id: ID!): Engine
    allEnginesForUser: [Engine]
    runBatchEngine(engineID: ID!, timeIntervalSeconds: Int!, params: JSON, delaySeconds: Int = 0): Boolean
    isBatchEngineRunning(engineID: ID!): Boolean
    cancelBatchEngine(engineID: ID!): Boolean
    canUserAddEngine: Boolean
  }

  type Mutation {
    createEngine(input: CreateEngineInput!): Engine!
    editEngine(id: ID!, dbConnectionID: ID!, input: EditEngineInput!): Engine
    deleteEngine(id: ID!): Engine
    importEngine(id: ID!, engine: ImportEngineInput!): Boolean
  }
`;
