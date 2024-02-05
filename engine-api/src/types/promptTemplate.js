export default `

  type PromptTemplate {
    id: ID!
    name: String!
    content: String!
    createdAt: String!
    users: [UserRole]
    dbConnection: DBConnectionEx
    databaseName: String
    isPrivate: Boolean!
    type: String!
  }

  type DBConnectionEx @exclude {
    id: ID!
    url: String!
    user: String!
    password: String!
    name: String!
    createdAt: String
    users: [UserRole]
    isPrivate: Boolean
    databases: [String]
  }

  type User {
    name: String
    email: String
    picture: String
    isAdmin: Boolean
    isCurrentUser: Boolean
  }

  type UserRole {
    user: User
    role: Role!
  }

  enum Role {
    OWNER
    MEMBER
    VIEWER
  }

  type Query {
    promptTemplate(id: ID!): PromptTemplate
    allPromptTemplatesForUser: [PromptTemplate]
  }
`;
