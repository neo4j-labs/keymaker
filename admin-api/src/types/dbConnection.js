export default `
  # Have to rename DBConnection to DBConnectionEx 
  # because things ending in Connection are reserved by the GraphQL Cursor Connections Specification
  # see https://relay.dev/graphql/connections.htm#sec-Reserved-Types
  type DBConnectionEx @exclude {
    id: ID!
    url: String!
    name: String!
    dbInfo: DBInfo
    engines: [Engine]
    createdAt: String
    users: [UserRole]
    isPrivate: Boolean
    isParallelRuntimeEnabled: Boolean
    databases: [String]
    canCurrentUserEdit: Boolean
    canCurrentUserDelete: Boolean
    labels(databaseName: String! = "default"): [String]
    propertyNames(databaseName: String! = "default", label: String!): [String]
  }
  
  type DBInfo @exclude {
    hasApoc: Boolean
    license: License
    versions: [String]
    isConnected: Boolean
  }

  enum License {
    NA
    COMMUNITY
    ENTERPRISE
  }

  input CreateDBConnectionInput {
    url: String!
    name: String!
    user: String!
    password: String!
    isPrivate: Boolean!
  }

  input EditDBConnectionInput {
    url: String
    name: String
    user: String
    password: String
    isPrivate: Boolean
    isParallelRuntimeEnabled:Boolean
  }
  
  type Query {
    dbConnection(id: ID!): DBConnectionEx
    allDBConnectionsForUser: [DBConnectionEx]
  }

  type Mutation {
    createDBConnection(input: CreateDBConnectionInput!): DBConnectionEx
    editDBConnection(id: ID!, properties: EditDBConnectionInput!): DBConnectionEx
    deleteDBConnection(id: ID!): DBConnectionEx
  }
`;
