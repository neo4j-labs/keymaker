export default `

  type LLM {
    id: ID!
    name: String!
    cypherPromptTemplate: PromptTemplate
    qaPromptTemplate: PromptTemplate
    cloudProvider: String!
    createdAt: String!
    users: [UserRole]
    isPrivate: Boolean!
    codeModel: String!
    qaModel: String!
    dbConnection: DBConnectionEx
    sampleQuestions: [SampleQuestion]
    dbSchemaImageUrl: String
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

  type SampleQuestion {
    priority: Int
    question:String
    createdAt: String
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
    llm(id: ID!): LLM
    allLLMsForUser: [LLM]
  }
`;
