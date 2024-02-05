export default `

  type DataModel {
    id: ID!
    name: String!
    labels: [String]
  }

  input UpdateCWPermissionsInput {
    key: ID
    nodeLabel: String
    userRoles: [Role]
  }
  
  type Query {
    allDataModelsForUser(dataModelKey: ID): [DataModel]
  }

  type Mutation {
    updateCWPermissions(input: UpdateCWPermissionsInput!): Boolean
  }
`;
