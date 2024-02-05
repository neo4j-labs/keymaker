import { gql } from "@apollo/client";

const ALL_PROMPT_TEMPLATES_FOR_USER = gql`
  query {
    prompts: allPromptTemplatesForUser {
        id
        name
        content
        createdAt
        dbConnection {
          id
          name
          password
          url
          user
        }
        users {
          role
        }
        isPrivate
        databaseName
    }
  }
`;


const GET_PROMPT_TEMPLATE_BY_ID = gql`
query PromptTemplate($id: ID!) {
    promptTemplate: promptTemplate(id: $id) {
        id
        name
        content
        createdAt
        dbConnection {
          id
          name
          password
          url
          user
        }
        users {
          role
        }
        isPrivate
        databaseName
  }
}
`;

const CREATE_PROMPT_TEMPLATE = gql`
mutation CreatePromptTemplate ($input: CreatePromptTemplateInput!) {
    promptTemplate: createPromptTemplate(input: $input) {
      id
      name
      isPrivate
      databaseName
      content
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

export {
    ALL_PROMPT_TEMPLATES_FOR_USER,
    GET_PROMPT_TEMPLATE_BY_ID,
    CREATE_PROMPT_TEMPLATE
};
