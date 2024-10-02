import { gql } from "@apollo/client";

const GET_PHASES = gql`
  query GetPhases($id: ID!) {
    engine(id: $id) {
      id
      name
      dataModel
      isPrivate
      isParallelRuntimeEnabled
      description
      databaseName
      returnLabel
      returnProperties
      canCurrentUserEdit
      canCurrentUserDelete
      users {
        role
        user {
          name
          email
          picture
        }
      }
      dbConnection {
        id
        url
        name
      }
      phases {
        id
        name
        showCypher
        description
        cypherQuery
        phaseType
        cypherWorkbenchCypherBuilderKey
        __typename
        active
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

const CREATE_PHASE = gql`
  mutation createPhase(
    $engineID: ID!
    $prevPhaseID: ID
    $phaseType: String!
    $input: CreatePhaseInput!
  ) {
    createPhase(
      engineID: $engineID
      prevPhaseID: $prevPhaseID
      phaseType: $phaseType
      input: $input
    ) {
      id
      name
      description
      cypherQuery
      phaseType
      __typename
      active
      ... on CypherExcludePhase {
        inverted
      }
      ... on CypherDiversityPhase {
        maxAmount
      }
    }
  }
`;

const EDIT_PHASE = gql`
  mutation editPhase($id: ID!, $input: EditPhaseInput!) {
    editPhase(id: $id, input: $input) {
      id
      name
      active
      cypherQuery
    }
  }
`;

const DELETE_PHASE = gql`
  mutation deletePhase($id: ID!) {
    deletePhase(id: $id)
  }
`;

export { GET_PHASES, CREATE_PHASE, EDIT_PHASE, DELETE_PHASE };
