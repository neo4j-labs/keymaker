import React, { useState } from "react";
import styled from "styled-components";
import * as compose from "lodash.flowright";
import { graphql } from "@apollo/client/react/hoc";
import { Query } from "@apollo/client/react/components";
import { Form, Radio, Message } from "semantic-ui-react";

import FormModal from "../../components/FormModal";

import {
  runMutation,
  checkInputs,
  notNullUndefinedOrEmpty
} from "../../util/helper";
import "../../App.css";

import { CREATE_JOB } from "../../graphql/job";
import { ALL_DB_CONNECTIONS_FOR_USER } from "../../graphql/dbConnection";

export const Text = styled.div`
  font-weight: 600;
  padding: 0 0 5px 0;
  font-size: 0.92857143em;
`;

const CreateJobModal = ({ isOpen, onClose, refetch, ...mutations }) => {
  const [name, setName] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isParallel, setIsParallel] = useState(false);
  const [dbConnectionID, setDBConnectionID] = useState("");

  const [showDBError, setShowDBError] = useState(false);
  const [showNameError, setShowNameError] = useState(false);

  const [showError, setShowError] = React.useState(false);
  const [errorText, setErrorText] = React.useState("");

  const resetFields = () => {
    setName("");
    setDBConnectionID("");
  };

  const resetErrors = () => {
    setShowDBError(false);
    setShowNameError(false);
  };

  const onMutationSuccess = () => {
    onClose();
    resetFields();
    resetErrors();
  };

  const onMutationError = (error) => {
    if (
      error.graphQLErrors[0].message ===
      "Keymaker license expired"
    ) {
      setShowError(true);
      setErrorText(
        "Your Keymaker license has expired"
      );
    }

  };

  const updateCache = (store, data) => {};

  const handleSubmit = () => {
    if (
      checkInputs([
        {
          input: name,
          functions: [notNullUndefinedOrEmpty],
          onError: () => {
            setShowNameError(true);
          }
        },
        {
          input: dbConnectionID,
          functions: [notNullUndefinedOrEmpty],
          onError: () => {
            setShowDBError(true);
          }
        }
      ])
    ) {
      const variables = {
        input: { name, dbConnectionID, isPrivate, isParallel }
      };
      runMutation(
        mutations.CREATE_JOB,
        variables,
        [],
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
        <Query query={ALL_DB_CONNECTIONS_FOR_USER}>
          {({ loading, error, data }) => {
            const dbConnections = data.dbConnections ? data.dbConnections : [];
            const dbOptions = loading
              ? []
              : dbConnections.map(db => ({
                  key: db.id,
                  value: db.id,
                  text: db.name
                }));
            return (
              <>
                <Form.Select
                  label="DB Connection"
                  options={dbOptions}
                  error={showDBError}
                  selectOnBlur={false}
                  value={dbConnectionID ? dbConnectionID : ""}
                  onChange={(e, data) => {
                    setShowDBError(false);
                    setDBConnectionID(data.value);
                  }}
                />
              </>
            );
          }}
        </Query>
        <Text className="text-small black">Private</Text>
        <Radio
          toggle
          checked={isPrivate}
          onChange={() => setIsPrivate(!isPrivate)}
        />
        <Text className="text-small black margin-top-small">Parallel</Text>
        <Radio
          toggle
          checked={isParallel}
          onChange={() => setIsParallel(!isParallel)}
        />
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

export default compose(
  graphql(CREATE_JOB, {
    name: "CREATE_JOB"
  })
)(CreateJobModal);
