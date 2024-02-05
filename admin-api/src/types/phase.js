export default `

  interface Phase {
    id: ID!
    name: String!
    description: String!
    phaseType: String!
    active: Boolean!
    showCypher: Boolean
    cypherQuery: String!
    cypherWorkbenchCypherBuilderKey: ID
  }

  type CypherDiscoveryPhase implements Phase {
    id: ID!
    name: String!
    description: String!
    phaseType: String!
    active: Boolean!
    showCypher: Boolean
    cypherQuery: String!
    cypherWorkbenchCypherBuilderKey: ID
  }

  type CypherExcludePhase implements Phase {
    id: ID!
    name: String!
    description: String!
    phaseType: String!
    active: Boolean!
    showCypher: Boolean
    cypherQuery: String!
    inverted: Boolean!
    cypherWorkbenchCypherBuilderKey: ID
  }

  type CypherBoostPhase implements Phase {
    id: ID!
    name: String!
    description: String!
    phaseType: String!
    active: Boolean!
    showCypher: Boolean
    cypherQuery: String!
    cypherWorkbenchCypherBuilderKey: ID
  }

  type CypherDiversityPhase implements Phase {
    id: ID!
    name: String!
    description: String!
    phaseType: String!
    active: Boolean!
    showCypher: Boolean
    cypherQuery: String!
    maxAmount: Int!
    cypherWorkbenchCypherBuilderKey: ID
  }

  type CypherCollectionPhase implements Phase {
    id: ID!
    name: String!
    description: String!
    phaseType: String!
    active: Boolean!
    showCypher: Boolean
    cypherQuery: String!
    cypherWorkbenchCypherBuilderKey: ID
  }

  type CypherWritePhase implements Phase {
    id: ID!
    name: String!
    description: String!
    phaseType: String!
    active: Boolean!
    showCypher: Boolean
    cypherQuery: String!
    cypherWorkbenchCypherBuilderKey: ID
  }

  type GDSCreatePhase implements Phase {
    id: ID!
    name: String!
    description: String!
    phaseType: String!
    active: Boolean!
    showCypher: Boolean
    cypherQuery: String!
    cypherWorkbenchCypherBuilderKey: ID
  }

  type GDSWritePhase implements Phase {
    id: ID!
    name: String!
    description: String!
    phaseType: String!
    active: Boolean!
    showCypher: Boolean
    cypherQuery: String!
    cypherWorkbenchCypherBuilderKey: ID
  }

  type GDSDropPhase implements Phase {
    id: ID!
    name: String!
    description: String!
    phaseType: String!
    active: Boolean!
    showCypher: Boolean
    cypherQuery: String!
    cypherWorkbenchCypherBuilderKey: ID
  }

  input CreatePhaseInput {
    name: String
    description: String
    active: Boolean
    showCypher: Boolean
    cypherQuery: String
    inverted: Boolean
    maxAmount: Int
    cypherWorkbenchCypherBuilderKey: ID
    returnLabel: String
  }

  input EditPhaseInput {
    name: String
    description: String
    active: Boolean
    showCypher: Boolean
    cypherQuery: String
    inverted: Boolean
    maxAmount: Int
    cypherWorkbenchCypherBuilderKey: ID
  }

  type Mutation {
    createPhase(engineID: ID!, prevPhaseID: ID, phaseType: String!, input: CreatePhaseInput!): Phase
    editPhase(id: ID!, input: EditPhaseInput!): Phase
    deletePhase(id: ID!): Boolean
  }
`;
