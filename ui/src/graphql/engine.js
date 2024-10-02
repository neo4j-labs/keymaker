import { gql } from "@apollo/client";

const ALL_ENGINES_FOR_USER = gql`
  query {
    engines: allEnginesForUser {
      id
      name
      createdAt
      isPrivate
      isParallelRuntimeEnabled
      description
      databaseName
      canCurrentUserDelete
      users {
        role
      }
      phases {
        id
      }
      dbConnection {
        id
        name
      }
    }
  }
`;

const CAN_USER_ADD_ENGINES = gql`
  query {
    canUserAddEngine: canUserAddEngine
  }
`;

const GET_ENGINE_BY_ID = gql`
  query Engine($id: ID!) {
    engine: engine(id: $id) {
      id
      name
      isPrivate
      isParallelRuntimeEnabled
      phases {
        id
        name
        description
        phaseType
        active
        showCypher
        cypherQuery
        ... on CypherExcludePhase {
          inverted
        }
        ... on CypherDiversityPhase {
          maxAmount
        }
      }
    }
  }
`;

const CREATE_ENGINE = gql`
  mutation CreateEngine($input: CreateEngineInput!) {
    engine: createEngine(input: $input) {
      id
      name
      isPrivate
      description
      databaseName
      returnLabel
      returnProperties
      canCurrentUserEdit
      canCurrentUserDelete
      users {
        role
        user {
          email
          picture
        }
      }
      dbConnection {
        id
        name
        labels
        databases
        dbInfo {
          license
          hasApoc
          versions
          isConnected
        }
      }
    }
  }
`;

const EDIT_ENGINE = gql`
  mutation EditEngineQuery(
    $id: ID!
    $dbConnectionID: ID!
    $input: EditEngineInput!
  ) {
    engine: editEngine(
      id: $id
      dbConnectionID: $dbConnectionID
      input: $input
    ) {
      id
      name
      isPrivate
      isParallelRuntimeEnabled
      description
      returnLabel
      returnProperties
    }
  }
`;

const EXPORT_ENGINE = gql`
  query Engine($id: ID!) {
    engine: engine(id: $id) {
      id
      phases {
        id
        name
        description
        phaseType
        active
        showCypher
        cypherQuery
        ... on CypherExcludePhase {
          inverted
        }
        ... on CypherDiversityPhase {
          maxAmount
        }
      }
    }
  }
`;

const RUN_BATCH_ENGINE = gql`
  query RunBatchEngine(
    $engineID: ID!
    $timeIntervalSeconds: Int!
    $params: JSON
    $delaySeconds: Int
  ) {
    runBatchEngine(
      engineID: $engineID
      timeIntervalSeconds: $timeIntervalSeconds
      params: $params
      delaySeconds: $delaySeconds
    )
  }
`;

const IS_BATCH_ENGINE_RUNNING = gql`
  query IsBatchEngineRunning($engineID: ID!) {
    isBatchEngineRunning: isBatchEngineRunning(engineID: $engineID)
  }
`;

const CANCEL_BATCH_ENGINE = gql`
  query CancelBatchEngine($engineID: ID!) {
    cancelBatchEngine(engineID: $engineID)
  }
`;

const IMPORT_ENGINE = gql`
  mutation ImportEngine($id: ID!, $engine: ImportEngineInput!) {
    engine: importEngine(id: $id, engine: $engine)
  }
`;

const DELETE_ENGINE = gql`
  mutation DeleteEngine($id: ID!) {
    engine: deleteEngine(id: $id) {
      id
    }
  }
`;

export {
  EDIT_ENGINE,
  DELETE_ENGINE,
  EXPORT_ENGINE,
  IMPORT_ENGINE,
  CREATE_ENGINE,
  GET_ENGINE_BY_ID,
  ALL_ENGINES_FOR_USER,
  RUN_BATCH_ENGINE,
  CANCEL_BATCH_ENGINE,
  IS_BATCH_ENGINE_RUNNING,
  CAN_USER_ADD_ENGINES,
};
