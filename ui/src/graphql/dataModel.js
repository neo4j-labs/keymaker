import { gql } from "@apollo/client";

const ALL_DATA_MODELS_FOR_USER = gql`
  query AllDataModelsForUser($dataModelKey: ID) {
    dataModels: allDataModelsForUser(dataModelKey: $dataModelKey) {
      id
      name
      labels
    }
  }
`;

const UPDATE_CW_PERMISSIONS = gql`
  mutation UpdateCWPermissions($input: UpdateCWPermissionsInput!) {
    dbConnection: updateCWPermissions(input: $input)
  }
`;

export { UPDATE_CW_PERMISSIONS, ALL_DATA_MODELS_FOR_USER };
