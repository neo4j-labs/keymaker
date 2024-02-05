import { gql } from "@apollo/client";

const CREATE_API_KEY = gql`
  mutation CreateAPIKey($duration: Int) {
    apiKey: createAPIKey(duration: $duration) {
      id
      key
      expirationDate {
        year
        month
        day
      }
    }
  }
`;

const UPDATE_API_KEY = gql`
  mutation UpdateAPIKey($key: String!, $duration: Int!) {
    apiKey: updateAPIKey(key: $key, duration: $duration) {
      id
      key
      expirationDate {
        year
        month
        day
      }
    }
  }
`;

export { CREATE_API_KEY, UPDATE_API_KEY };
