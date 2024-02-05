import React, { useState } from "react";
import PropTypes from "prop-types";
import styled from "styled-components";
import { graphql } from "@apollo/client/react/hoc";
import * as compose from "lodash.flowright";
import { Form, Radio, Message } from "semantic-ui-react";
import FormModal from "../../components/FormModal";

import {
  runMutation,
  checkInputs,
  notNullUndefinedOrEmpty,
} from "../../util/helper";
import "../../App.css";

import {
  CREATE_DB_CONNECTION,
  ALL_DB_CONNECTIONS_FOR_USER,
} from "../../graphql/dbConnection";

export const Text = styled.div`
  font-weight: 600;
  padding: 0 0 5px 0;
  font-size: 0.92857143em;
`;

export const Margin = styled.div`
  margin: 0 0 15px 0;
`;

export const UpdateCredentials = styled.div`
  color: #008bc1;
  margin-top: 15px;
  font-size: 1.1em;
  cursor: pointer;
`;

const CreateDatabaseConnectionModal = ({ isOpen, onClose, ...mutations }) => {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [showUrlError, setShowUrlError] = useState(false);
  const [showNameError, setShowNameError] = useState(false);
  const [showUserError, setShowUserError] = useState(false);
  const [showPasswordError, setShowPasswordError] = useState(false);
  const [showError, setShowError] = React.useState(false);
  const [errorText, setErrorText] = React.useState("");

  const resetFields = () => {
    setUrl("");
    setName("");
    setUser("");
    setPassword("");
    setErrorText("");
    setIsPrivate(false);
  };

  const resetErrors = () => {
    setShowUrlError(false);
    setShowNameError(false);
    setShowUserError(false);
    setShowPasswordError(false);
    setShowError(false);
  };

  const onMutationSuccess = () => {
    onClose();
    resetFields();
    resetErrors();
  };

  const onMutationError = (error) => {
    if (
      error.graphQLErrors[0].message ===
      "Failed to invoke procedure `apoc.util.validate`: Caused by: java.lang.RuntimeException: Max number of licensed database connections reached"
    ) {
      setShowError(true);
      setErrorText(
        "You've reached your DB limit, Contact Neo4j admin for upgrade"
      );
    }

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

  const updateCache = (store, data) => {
    // get the new db connection returned by the mutation
    // it must have all the same fields that ALL_DB_CONNECTIONS_FOR_USER returns
    const newDBConnection = data["dbConnection"];
    newDBConnection.canCurrentUserEdit = true;
    newDBConnection.canCurrentUserDelete = true;
    newDBConnection.createdAt = "today";
    // update the db connections in the cache
    const { dbConnections } = store.readQuery({
      query: ALL_DB_CONNECTIONS_FOR_USER,
    });
    dbConnections.unshift(newDBConnection);
    store.writeQuery({
      query: ALL_DB_CONNECTIONS_FOR_USER,
      data: { dbConnections },
    });
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
          input: url,
          functions: [notNullUndefinedOrEmpty],
          onError: () => setShowUrlError(true),
        },
        {
          input: user,
          functions: [notNullUndefinedOrEmpty],
          onError: () => setShowUserError(true),
        },
        {
          input: password,
          functions: [notNullUndefinedOrEmpty],
          onError: () => setShowPasswordError(true),
        },
      ])
    ) {
      const variables = { input: { name, url, user, password, isPrivate } };
      runMutation(
        mutations.CREATE_DB_CONNECTION,
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
      <Form>
        <Form.Input
          label="Name"
          value={name ? name : ""}
          error={showNameError}
          onChange={(e, data) => {
            setName(data.value);
            setShowNameError(false);
          }}
        />
        <Form.Input
          label="Connection URL"
          value={url ? url : ""}
          error={showUrlError}
          onChange={(e, data) => {
            setUrl(data.value);
            setShowUrlError(false);
          }}
        />
        <Text>Private</Text>
        <Margin>
          <Radio
            toggle
            checked={isPrivate}
            onChange={() => setIsPrivate(!isPrivate)}
          />
        </Margin>
        <Form.Input
          label="Username"
          value={user ? user : ""}
          error={showUserError}
          onChange={(e, data) => {
            setUser(data.value);
            setShowUserError(false);
          }}
        />
        <Form.Input
          label="Password"
          value={password ? password : ""}
          error={showPasswordError}
          type="password"
          onChange={(e, data) => {
            setPassword(data.value);
            setShowPasswordError(false);
          }}
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

CreateDatabaseConnectionModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default compose(
  graphql(CREATE_DB_CONNECTION, {
    name: "CREATE_DB_CONNECTION",
  })
)(CreateDatabaseConnectionModal);
