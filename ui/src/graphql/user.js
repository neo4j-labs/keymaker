import { gql } from "@apollo/client";

const GET_USER_ROLES_FOR_ENGINE = gql`
  query GetUserRolesForEngine($id: ID!) {
    userRoles: getUserRolesForEngine(id: $id) {
      role
      user {
        name
        email
        picture
        isAdmin
        isCurrentUser
      }
    }
  }
`;

const GET_CURRENT_USER = gql`
  query GetCurrentUser {
    user: getCurrentUser {
      name
      email
      picture
    }
  }
`;

const GET_USER_ROLES_FOR_DB = gql`
  query GetUserRolesForDB($id: ID!) {
    userRoles: getUserRolesForDB(id: $id) {
      role
      user {
        name
        email
        picture
        isAdmin
        isCurrentUser
      }
    }
  }
`;

const ADD_USER_ROLE_TO_ENGINE = gql`
  mutation AddUserRoleToEngine($input: UserRoleInput!) {
    userRole: addUserRoleToEngine(input: $input) {
      role
      user {
        name
        email
        picture
      }
    }
  }
`;

const ADD_USER_ROLE_TO_DB = gql`
  mutation AddUserRoleToDB($input: UserRoleInput!) {
    userRole: addUserRoleToDB(input: $input) {
      role
      user {
        name
        email
        picture
      }
    }
  }
`;

const EDIT_USER_ROLE_ON_ENGINE = gql`
  mutation EditUserRoleOnEngine($input: UserRoleInput!) {
    userRole: editUserRoleOnEngine(input: $input) {
      role
      user {
        name
        email
        picture
      }
    }
  }
`;

const EDIT_USER_ROLE_ON_DB = gql`
  mutation EditUserRoleOnDB($input: UserRoleInput!) {
    userRole: editUserRoleOnDB(input: $input) {
      role
      user {
        name
        email
        picture
      }
    }
  }
`;

const SEARCH_USER_BY_EMAIL = gql`
  query SearchUserByEmail($email: String!) {
    user: searchUserByEmail(email: $email) {
      name
      email
      picture
    }
  }
`;

const REMOVE_USER_ROLE_FROM_ENGINE = gql`
  mutation RemoveUserRoleFromEngine($input: UserRoleInput!) {
    userRole: removeUserRoleFromEngine(input: $input) {
      role
      user {
        name
        email
        picture
      }
    }
  }
`;

const REMOVE_USER_ROLE_FROM_DB = gql`
  mutation RemoveUserRoleFromDB($input: UserRoleInput!) {
    userRole: removeUserRoleFromDB(input: $input) {
      role
      user {
        name
        email
        picture
      }
    }
  }
`;

const LEAVE_ENGINE = gql`
  mutation LeaveEngine($input: UserRoleInput!) {
    userRole: leaveEngine(input: $input) {
      role
      user {
        name
        email
        picture
      }
    }
  }
`;

const LEAVE_DB = gql`
  mutation LeaveDB($input: UserRoleInput!) {
    userRole: leaveDB(input: $input) {
      role
      user {
        name
        email
        picture
      }
    }
  }
`;

export {
  GET_USER_ROLES_FOR_DB,
  GET_USER_ROLES_FOR_ENGINE,
  ADD_USER_ROLE_TO_DB,
  GET_CURRENT_USER,
  ADD_USER_ROLE_TO_ENGINE,
  EDIT_USER_ROLE_ON_DB,
  EDIT_USER_ROLE_ON_ENGINE,
  SEARCH_USER_BY_EMAIL,
  REMOVE_USER_ROLE_FROM_DB,
  REMOVE_USER_ROLE_FROM_ENGINE,
  LEAVE_ENGINE,
  LEAVE_DB,
};
