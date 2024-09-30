import { gql } from "@apollo/client";

const ALL_DB_CONNECTIONS_FOR_USER = gql`
  query {
    dbConnections: allDBConnectionsForUser {
      id
      url
      name
      createdAt
      isPrivate
      isParallelRuntimeEnabled
      canCurrentUserEdit
      canCurrentUserDelete
      engines {
        id
      }
      users {
        role
        user {
          email
          picture
        }
      }
    }
  }
`;

const ALL_DB_CONNECTIONS_FOR_USER_2 = gql`
  query {
    dbConnections: allDBConnectionsForUser {
      id
      name
    }
  }
`;

const GET_DB_INFO = gql`
  query GetDBInfo($id: ID!) {
    dbConnection(id: $id) {
      dbInfo {
        license
        hasApoc
        versions
        isConnected
      }
    }
  }
`;

const GET_DATABASES = gql`
  query GetDBInfo($id: ID!) {
    dbConnection(id: $id) {
      databases
    }
  }
`;

const CREATE_DB_CONNECTION = gql`
  mutation CreateDBConnection($input: CreateDBConnectionInput!) {
    dbConnection: createDBConnection(input: $input) {
      id
      url
      name
      isPrivate
      engines {
        id
      }
      users {
        role
        user {
          email
          picture
        }
      }
    }
  }
`;

const EDIT_DB_CONNECTION = gql`
  mutation EditDBConnection($id: ID!, $properties: EditDBConnectionInput!) {
    dbConnection: editDBConnection(id: $id, properties: $properties) {
      id
      name
      url
      isPrivate
      isParallelRuntimeEnabled
      dbInfo {
        isConnected
        license
        versions
        hasApoc
      }
    }
  }
`;

const DELETE_DB_CONNECTION = gql`
  mutation DeleteDBConnection($id: ID!) {
    dbConnection: deleteDBConnection(id: $id) {
      id
    }
  }
`;

const GET_DB_LABELS = gql`
  query GetDBProperties($id: ID!, $databaseName: String!) {
    dbConnection(id: $id) {
      labels(databaseName: $databaseName)
    }
  }
`;

const GET_DB_PROPERTIES = gql`
  query GetDBProperties($id: ID!, $databaseName: String!, $label: String!) {
    dbConnection(id: $id) {
      propertyNames(databaseName: $databaseName, label: $label)
    }
  }
`;

export {
  GET_DB_INFO,
  GET_DATABASES,
  GET_DB_LABELS,
  GET_DB_PROPERTIES,
  EDIT_DB_CONNECTION,
  DELETE_DB_CONNECTION,
  CREATE_DB_CONNECTION,
  ALL_DB_CONNECTIONS_FOR_USER,
  ALL_DB_CONNECTIONS_FOR_USER_2,
};
