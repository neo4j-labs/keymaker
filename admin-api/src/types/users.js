export default `

  type LicenseType{
    license: String!
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

  type LicenseTypeAndExpiration {
    licenseType: String
    licenseExpires: Boolean
    licenseExpiration: String
  }
  
  input CustomUser {
    email: String
    password: String
    name: String
    picture: String
  }

  input UserRoleInput {
    id: ID!
    role: Role
    email: String!
  }

  enum Role {
    OWNER
    MEMBER
    VIEWER
  }

  type Query {
    getCurrentUser: User!
    searchUserByEmail(email: String!): [User]!
    getUserRolesForEngine(id: ID!): [UserRole]!
    getUserRolesForDB(id: ID!): [UserRole]!
    loginUser(input: CustomUser!): User
    acceptedEula(email: String): String!
    checkLicense: String!
    getLicenseTypeAndExpiration: LicenseTypeAndExpiration!
  }

  type Mutation {
    createUser: User!
    addUserRoleToEngine(input: UserRoleInput!): UserRole!
    editUserRoleOnEngine(input: UserRoleInput!): UserRole!
    removeUserRoleFromEngine(input: UserRoleInput!): UserRole!
    leaveEngine(input: UserRoleInput!): UserRole!
    addUserRoleToDB(input: UserRoleInput!): UserRole!
    editUserRoleOnDB(input: UserRoleInput!): UserRole!
    removeUserRoleFromDB(input: UserRoleInput!): UserRole!
    leaveDB(input: UserRoleInput!): UserRole!
    createUserSignUp(input: CustomUser!): User!
    logInLocalUser(email: String): User!
    setEulaEnterprise(email:String): User!
  }
`;
