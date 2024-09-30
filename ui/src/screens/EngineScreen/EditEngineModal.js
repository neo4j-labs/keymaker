import React, { useState } from "react";
import PropTypes from "prop-types";
import styled from "styled-components";
import * as compose from "lodash.flowright";
import { useQuery } from "@apollo/client";
import { graphql } from "@apollo/client/react/hoc";
import { Query } from "@apollo/client/react/components";
import { Form, Message,Radio } from "semantic-ui-react";

import FormModal from "../../components/FormModal";

import {
  runMutation,
  checkInputs,
  arrayHasElements,
  notNullUndefinedOrEmpty,
} from "../../util/helper";
import { doListsMatch } from "../../util/dataModelHelper";

import {
  GET_DB_INFO,
  GET_DB_LABELS,
  GET_DATABASES,
  GET_DB_PROPERTIES,
  ALL_DB_CONNECTIONS_FOR_USER_2,
} from "../../graphql/dbConnection";
import { GET_PHASES } from "../../graphql/phase";
import { EDIT_ENGINE } from "../../graphql/engine";
import { ALL_DATA_MODELS_FOR_USER } from "../../graphql/dataModel";

export const Text = styled.div`
  color: rgba(0, 0, 0, 0.87);
  font-weight: 600;
  padding: 0 0 5px 0;
  font-size: 0.92857143em;
`;

export const UpdateDBDomain = styled.div`
  diaplay: flex;
  flex-direction: column;
  margin-bottom: 15px;
`;

export const TextBold = styled.div`
  color: rgba(0, 0, 0, 0.87);
  font-weight: 600;
  padding: 0 0 5px 0;
  font-size: 0.92857143em;
`;

export const NoteOnParallelRuntime = styled.div`
  color: #008bc1;
  font-weight: 500;
  padding: 0 0 5px 0;
  font-size: 0.92857143em;

  a {
    color: inherit;
    text-decoration: underline;
    margin-left: 5px;
  }
`;

const EditEngineModal = ({ isOpen, onClose, engine, ...mutations }) => {
  // props
  const engineID = engine.id;
  const {
    name: startName,
    description: startDescription,
    dbConnection: startDBConnection,
    databaseName: startDatabaseName,
    returnLabel: startReturnLabel,
    returnProperties: startReturnProperties,
    dataModel: startDataModel,
    isParallelRuntimeEnabled: startIsParallelRuntimeEnabled
  } = engine;

  // state
  const [name, setName] = useState(startName);
  const [description, setDescription] = useState(startDescription);
  const [dbConnection, setDBConnection] = useState(startDBConnection);
  const [databaseName, setDatabaseName] = useState(startDatabaseName);
  const [returnLabel, setReturnLabel] = useState(startReturnLabel);
  const [returnProperties, setReturnProperties] = useState(
    startReturnProperties
  );
  const [dataModel, setDataModel] = useState(startDataModel);
  const [isParallelRuntimeEnabled, setIsParallelRuntimeEnabled] = useState(startIsParallelRuntimeEnabled);


  const [showDBError, setShowDBError] = useState(false);
  const [showNameError, setShowNameError] = useState(false);
  const [showDataModelError, setShowDataModelError] = useState(false);
  const [showDatabaseNameError, setShowDatabaseNameError] = useState(false);
  const [showReturnLabelError, setShowReturnLabelError] = useState(false);
  const [showReturnPropertiesError, setShowReturnPropertiesError] =
    useState(false);

  const [showError, setShowError] = React.useState(false);
  const [errorText, setErrorText] = React.useState("");

  const { data: dataModels } = useQuery(ALL_DATA_MODELS_FOR_USER, {
    variables: { dataModelKey: startDataModel },
  });

  const getDatabaseNameOptions = (databases) => {
    return databases.map((database) => ({
      key: database,
      value: database,
      text: database,
    }));
  };

  const resetFields = () => {
    setName(startName);
    setDataModel(startDataModel);
    setDescription(startDescription);
    setDBConnection(startDBConnection);
    setReturnLabel(startReturnLabel);
    setReturnProperties(startReturnProperties);
    setIsParallelRuntimeEnabled(startIsParallelRuntimeEnabled);
  };

  const resetErrors = () => {
    setShowDBError(false);
    setShowNameError(false);
  };

  const onMutationSuccess = () => {
    // we don't need to refetch or update the cache because apollo will handle updates itself
    onClose();
    resetErrors();
  };

  const onMutationError = (error) => {
    if (error.graphQLErrors[0].message === "Keymaker license expired") {
      setShowError(true);
      setErrorText("Your Keymaker license has expired");
    }
  };

  const handleSubmit = () => {
    if (
      checkInputs([
        {
          input: name,
          functions: [notNullUndefinedOrEmpty],
          onError: () => setShowNameError(true),
        },
        {
          input: databaseName,
          functions: [notNullUndefinedOrEmpty],
          onError: () => {
            setShowDatabaseNameError(true);
          },
        },
        {
          input: returnLabel,
          functions: [notNullUndefinedOrEmpty],
          onError: () => {
            setShowReturnLabelError(true);
          },
        },
        {
          input: returnProperties,
          functions: [arrayHasElements],
          onError: () => {
            setShowReturnPropertiesError(true);
          },
        },
      ])
    ) {
      const variables = {
        id: engine.id,
        dbConnectionID: dbConnection.id,
        input: {
          name,
          dataModel,
          description,
          returnLabel,
          isParallelRuntimeEnabled,
          databaseName,
          returnProperties,
        },
      };
      runMutation(
        mutations.EDIT_ENGINE,
        variables,
        [{ query: GET_PHASES, variables: { id: engineID } }],
        onMutationError,
        onMutationSuccess,
        undefined
      );
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={() => {
        onClose();
        resetFields();
        resetErrors();
      }}
      buttonName="Submit"
      size={"tiny"}
      onSubmit={() => {
        resetErrors();
        handleSubmit();
      }}
    >
      <Form>
        <Form.Input
          label="Engine Name"
          value={name ? name : ""}
          error={showNameError}
          onChange={(e, data) => {
            setName(data.value);
            setShowNameError(false);
          }}
        />
        <Form.TextArea
          label="Description"
          value={description ? description : ""}
          onChange={(e, data) => setDescription(data.value)}
        />

        <Query query={ALL_DB_CONNECTIONS_FOR_USER_2}>
          {({ loading, data }) => {
            const dbOptions = loading
              ? []
              : data.dbConnections
                .toSorted((a, b) => {
                  if (a.name < b.name) return -1;
                  if (a.name > b.name) return 1;
                  return 0;
                })
                .map((db) => ({
                  key: db.id,
                  value: db.id,
                  text: db.name,
                }));
            return (
              <Form.Select
                label="Database Connection"
                options={dbOptions}
                error={showDBError}
                selectOnBlur={false}
                value={dbConnection ? dbConnection.id : ""}
                onChange={(e, data) => {
                  setShowDBError(false);
                  const selectedDB = dbConnections.find((db) => {
                    return db.id === data.value;
                  });
                  setDBConnection(selectedDB);
                  setDatabaseName("default");
                  setReturnLabel("");
                  setReturnProperties([]);
                }}
              />
            );
          }}
        </Query>
        <Query
          query={GET_DB_INFO}
          variables={{ id: dbConnection ? dbConnection.id : null }}
        >
          {({ loading, error, data }) => {
            if (loading || error) return <div></div>;
            const dbVersion = data.dbConnection.dbInfo.versions[0];
            if (dbVersion && parseInt(dbVersion[0], 10) >= 4) {
              return (
                <Query
                  query={GET_DATABASES}
                  variables={{ id: dbConnection.id }}
                >
                  {({ loading, error, data }) => {
                    if (loading || error) return <div></div>;
                    const databaseNameOptions = getDatabaseNameOptions(
                      data.dbConnection.databases
                    );
                    return (
                      <Form.Select
                        label="Database Name"
                        options={databaseNameOptions}
                        value={databaseName}
                        error={showDatabaseNameError}
                        onChange={(e, data) => {
                          setDatabaseName(data.value);
                          setReturnLabel("");
                          setReturnProperties([]);
                          setShowDatabaseNameError(false);
                        }}
                      />
                    );
                  }}
                </Query>
              );
            } else {
              return <div />;
            }
          }}
        </Query>
        <Query
          query={GET_DB_LABELS}
          variables={{
            id: dbConnection ? dbConnection.id : null,
            databaseName: databaseName,
          }}
        >
          {({ loading, error, data }) => {
            const dbConnection = data ? data.dbConnection : {};
            const labels = dbConnection ? dbConnection.labels : [];
            const labelOptions =
              loading || !labels
                ? []
                : labels
                  .toSorted((a, b) => {
                    if (a < b) return -1;
                    if (a > b) return 1;
                    return 0;
                  })
                  .map((label) => ({
                    key: label,
                    value: label,
                    text: label,
                  }));
            return (
              <>
                <Form.Select
                  label="Cypher Workbench Data Model (Optional)"
                  options={
                    dataModels
                      ? [
                        { key: "none", value: "None", text: "None" },
                        ...dataModels.dataModels
                          .map((d) => {
                            return {
                              key: d.id,
                              value: d.id,
                              text: d.name,
                            };
                          })
                          .toSorted((a, b) => {
                            return a.text.toUpperCase() > b.text.toUpperCase()
                              ? 1
                              : -1;
                          }),
                      ]
                      : [{ key: "none", value: "None", text: "None" }]
                  }
                  value={dataModel}
                  error={
                    showDataModelError
                      ? {
                        content:
                          "Warning: The selected database and data model may not match.",
                        pointing: "above",
                      }
                      : false
                  }
                  onChange={(e, data) => {
                    setShowDataModelError(false);
                    if (data.value === "None") {
                      setDataModel("None");
                      return;
                    }
                    const selectedModel = dataModels.dataModels.find(
                      (model) => {
                        return model.id === data.value;
                      }
                    );
                    if (!doListsMatch(selectedModel.labels, labels, 0.5)) {
                      setShowDataModelError(true);
                    }
                    setDataModel(data.value);
                  }}
                />
                <Form.Select
                  label="Return Label"
                  options={labelOptions}
                  value={returnLabel}
                  error={showReturnLabelError}
                  onChange={(e, data) => {
                    setReturnProperties([]);
                    setReturnLabel(data.value);
                    setShowReturnLabelError(false);
                  }}
                />
              </>
            );
          }}
        </Query>
        <Query
          query={GET_DB_PROPERTIES}
          variables={{
            id: dbConnection ? dbConnection.id : null,
            databaseName: databaseName,
            label: returnLabel,
          }}
        >
          {({ loading, error, data }) => {
            const dbConnection = data ? data.dbConnection : {};
            const properties = dbConnection ? dbConnection.propertyNames : [];
            const propertyOptions =
              loading || !properties
                ? []
                : properties
                  .toSorted((a, b) => {
                    if (a < b) return -1;
                    if (a > b) return 1;
                    return 0;
                  })
                  .map((property) => ({
                    key: property,
                    value: property,
                    text: property,
                  }));
            return (
              <Form.Select
                multiple
                label="Return Properties"
                options={propertyOptions}
                error={showReturnPropertiesError}
                value={returnProperties ? returnProperties : []}
                onChange={(e, data) => {
                  setReturnProperties(data.value);
                  setShowReturnPropertiesError(false);
                }}
              />
            );
          }}
        </Query>
        <UpdateDBDomain>
          <TextBold>Parallel Runtime</TextBold>
          <Radio
            toggle
            checked={isParallelRuntimeEnabled}
            onChange={() => setIsParallelRuntimeEnabled(!isParallelRuntimeEnabled)}
          />
        </UpdateDBDomain>
        <NoteOnParallelRuntime>
         Note: Enable Parallel Runtime for complex queries if your DB supports it.
          <a
            href="https://neo4j.com/docs/cypher-manual/current/planning-and-tuning/runtimes/reference/"
            target="_blank"
            rel="noopener noreferrer"
          >
            [Learn More]
          </a>
        </NoteOnParallelRuntime>
      </Form>
      {showError ? (
        <Message
          size="large"
          floating
          onDismiss={() => {
            setShowError(false);
            setErrorText("");
          }}
          error
          header={errorText}
        />
      ) : null}
    </FormModal>
  );
};

EditEngineModal.propTypes = {
  engine: PropTypes.shape({
    name: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    dbConnection: PropTypes.shape({
      labels: PropTypes.array,
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      dbInfo: PropTypes.shape({
        hasApoc: PropTypes.bool.isRequired,
        isConnected: PropTypes.bool.isRequired,
        license: PropTypes.oneOf(["ENTERPRISE", "COMMUNITY", "NA"]),
      }),
    }),
    users: PropTypes.arrayOf(
      PropTypes.shape({
        role: PropTypes.string.isRequired,
        user: PropTypes.shape({
          email: PropTypes.string.isRequired,
          picture: PropTypes.string,
        }),
      })
    ).isRequired,
  }).isRequired,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default compose(
  graphql(EDIT_ENGINE, {
    name: "EDIT_ENGINE",
  })
)(EditEngineModal);
