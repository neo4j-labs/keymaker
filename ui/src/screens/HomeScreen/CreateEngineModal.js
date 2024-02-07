import React, { useState } from "react";
import PropTypes from "prop-types";
import styled from "styled-components";
import * as compose from "lodash.flowright";
import { useQuery } from "@apollo/client";
import { graphql } from "@apollo/client/react/hoc";
import { Query } from "@apollo/client/react/components";
import { Form, Message } from "semantic-ui-react";

import FormModal from "../../components/FormModal";

import {
  runMutation,
  checkInputs,
  notNullUndefinedOrEmpty,
  containsNoSpaces,
  arrayHasElements,
} from "../../util/helper";
import { doListsMatch } from "../../util/dataModelHelper";

import {
  GET_DB_INFO,
  GET_DATABASES,
  GET_DB_LABELS,
  GET_DB_PROPERTIES,
  ALL_DB_CONNECTIONS_FOR_USER_2,
} from "../../graphql/dbConnection";
import { ALL_DATA_MODELS_FOR_USER } from "../../graphql/dataModel";
import { CREATE_ENGINE, ALL_ENGINES_FOR_USER } from "../../graphql/engine";

export const Text = styled.div`
  font-weight: 600;
  padding: 0 0 5px 0;
  font-size: 0.92857143em;
`;

const CreateEngineModal = ({ isOpen, onClose, ...mutations }) => {
  const [id, setID] = useState();
  const [name, setName] = useState();
  const [description, setDescription] = useState("");
  const [dbConnection, setDBConnection] = useState();
  const [databaseName, setDatabaseName] = useState("default");
  const [returnLabel, setReturnLabel] = useState();
  const [returnProperties, setReturnProperties] = useState();
  const [dataModel, setDataModel] = useState("None");

  const [showDBError, setShowDBError] = useState(false);
  const [showIDError, setShowIDError] = useState(false);
  const [showNameError, setShowNameError] = useState(false);
  const [showDataModelError, setShowDataModelError] = useState(false);
  const [showDatabaseNameError, setShowDatabaseNameError] = useState(false);
  const [showReturnLabelError, setShowReturnLabelError] = useState(false);
  const [showReturnPropertiesError, setShowReturnPropertiesError] =
    useState(false);
  const [showError, setShowError] = React.useState(false);
  const [errorText, setErrorText] = React.useState("");

  const { data: dataModels } = useQuery(ALL_DATA_MODELS_FOR_USER, {
    variables: { dataModelKey: "" },
  });

  const resetFields = () => {
    setID();
    setName();
    setDescription("");
    setDBConnection();
    setDatabaseName("default");
    setReturnLabel();
    setDataModel("None");
    setReturnProperties();
    setErrorText("");
  };

  const resetErrors = () => {
    setShowDBError(false);
    setShowIDError(false);
    setShowNameError(false);
    setShowDataModelError(false);
    setShowReturnLabelError(false);
    setShowReturnPropertiesError(false);
    setShowError(false);
  };

  const onMutationSuccess = () => {
    onClose();
    resetFields();
    resetErrors();
  };

  const onMutationError = (error) => {
    if (
      error.message === "GraphQL error: An engine with that id already exists"
    ) {
      setShowIDError(true);
    } else if (
      error.graphQLErrors[0].message ===
      "Failed to invoke procedure `apoc.util.validate`: Caused by: java.lang.RuntimeException: Max number of licensed engines reached"
    ) {
      setShowError(true);
      setErrorText(
        "You've reached your Engine limit, Contact Neo4j admin for upgrade"
      );
    } else if (
      error.graphQLErrors[0].message ===
      "Failed to invoke procedure `apoc.util.validate`: Caused by: java.lang.RuntimeException: The Engine Already Exists"
    ) {
      setShowError(true);
      setErrorText(
        "The Engine Already Exists"
      );
    }

    if (error.graphQLErrors[0].message === "Keymaker license expired") {
      setShowError(true);
      setErrorText("Your Keymaker license has expired");
    }
  };

  const updateCache = (store, data) => {
    // get the new engine returned by the mutation
    // it must have all the same fields that ALL_ENGINES_FOR_USER returns
    const newEngine = data["engine"];
    newEngine.phases = [];
    newEngine.createdAt = "today";
    newEngine.canCurrentUserEdit = true;
    newEngine.canCurrentUserDelete = true;

    // update the engines in the cache
    const { engines } = store.readQuery({
      query: ALL_ENGINES_FOR_USER,
    });
    engines.unshift(newEngine);
    store.writeQuery({
      query: ALL_ENGINES_FOR_USER,
      data: { engines },
    });
  };

  const getDatabaseNameOptions = (databases) => {
    console.log("databases",databases)
    return databases.map((database) => ({
      key: database,
      value: database,
      text: database,
    }));
  };

  const handleSubmit = () => {
    if (
      checkInputs([
        {
          input: name,
          functions: [notNullUndefinedOrEmpty],
          onError: () => {
            setShowNameError(true);
          },
        },
        {
          input: dbConnection ? dbConnection.id : null,
          functions: [notNullUndefinedOrEmpty],
          onError: () => {
            setShowDBError(true);
          },
        },
        {
          input: id,
          functions: [notNullUndefinedOrEmpty, containsNoSpaces],
          onError: () => {
            setShowIDError(true);
          },
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
        input: {
          id,
          name,
          isPrivate: true,
          description,
          dbConnectionID: dbConnection.id,
          databaseName,
          returnLabel,
          returnProperties,
          dataModel,
        },
      };
      runMutation(
        mutations.CREATE_ENGINE,
        variables,
        [{ query: ALL_DB_CONNECTIONS_FOR_USER_2 }],
        onMutationError,
        onMutationSuccess,
        updateCache
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
      <Form error>
        <Form.Input
          label="Name"
          className="grey"
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
        <Form.Input
          fluid
          label="Engine ID"
          value={id ? id : ""}
          onChange={(e, data) => {
            setID(data.value);
            setShowIDError(false);
          }}
          error={
            showIDError
              ? {
                content: "that ID is invalid or already exists",
                pointing: "above",
              }
              : false
          }
        />
        <Query query={ALL_DB_CONNECTIONS_FOR_USER_2}>
          {({ loading, data }) => {
            const dbConnections = data.dbConnections ? data.dbConnections : [];
            const dbOptions = loading
              ? []
              : dbConnections
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
                  setReturnLabel();
                  setReturnProperties([]);
                  setDatabaseName("default");
                  setDBConnection(selectedDB);
                }}
              />
            );
          }}
        </Query>
        {dbConnection && (
          <div>
            <Query query={GET_DB_INFO} variables={{ id: dbConnection.id }}>
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
              variables={{ id: dbConnection.id, databaseName: databaseName }}
            >
              {({ loading, data }) => {
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
                                return a.text.toUpperCase() >
                                  b.text.toUpperCase()
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
                id: dbConnection.id,
                databaseName: databaseName,
                label: returnLabel,
              }}
            >
              {({ loading, data }) => {
                const dbConnection = data ? data.dbConnection : {};
                const properties = dbConnection
                  ? dbConnection.propertyNames
                  : [];
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
                    label="Return Properties"
                    options={propertyOptions}
                    multiple
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
          </div>
        )}
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

CreateEngineModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default compose(
  graphql(CREATE_ENGINE, {
    name: "CREATE_ENGINE",
  })
)(CreateEngineModal);
