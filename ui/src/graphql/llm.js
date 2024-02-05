import { gql } from "@apollo/client";

const ALL_LLMS_FOR_USER = gql`
  query {
    llms: allLLMsForUser {
        id
        cloudProvider
        codeModel
        qaModel
        name
        createdAt
        isPrivate
        dbConnection {
          id
          name
          url
          password
          user
        }
        promptTemplate {
            id
            name
            content
            databaseName
        }
        users {
          role
        }
    }
  }
`;


const GET_LLM_BY_ID = gql`
query LLM($id: ID!) {
    llm: llm(id: $id) {
        id
        cloudProvider
        codeModel
        qaModel
        name
        createdAt
        isPrivate
        dbConnection {
          id
          name
          url
          password
          user
        }
        promptTemplate {
            id
            name
            content
            databaseName
        }
        users {
          role
        }
  }
}
`;

const CREATE_LLM = gql`
mutation CreateLLM ($input: CreateLLMInput!) {
    llm: createLLM(input: $input) {
      id
      name
      cloudProvider
      codeModel
      qaModel
      isPrivate
      users {
        role
        user {
          email
          picture
        }
      }
      promptTemplate {
        id
        name
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

export {
    ALL_LLMS_FOR_USER,
    GET_LLM_BY_ID,
    CREATE_LLM
};
