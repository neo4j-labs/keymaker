export default `

  type APIKey {
    id: ID!
    key: String!
    expirationDate: DateEx
  }

  type Mutation {
    createAPIKeyForOrg(org: String, duration: Int = 0): APIKey
    createAPIKey(duration: Int = 0): APIKey
    updateAPIKey(key: String!, duration: Int!): APIKey
  }
`;
