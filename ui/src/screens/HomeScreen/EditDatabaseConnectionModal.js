import React, { useState } from "react";
import PropTypes from "prop-types";
import styled from "styled-components";
import { graphql } from "@apollo/client/react/hoc";
import * as compose from "lodash.flowright";
import { Form, Radio, Message } from "semantic-ui-react";

import FormModal from "../../components/FormModal";

import { ALL_ENGINES_FOR_USER } from "../../graphql/engine";
import { EDIT_DB_CONNECTION } from "../../graphql/dbConnection";

import {
  runMutation,
  checkInputs,
  notNullUndefinedOrEmpty,
} from "../../util/helper";

export const UpdateCredentials = styled.div`
  color: #008bc1;
  margin-top: 15px;
  font-size: 1.1em;
  cursor: pointer;
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

export const Text = styled.div`
  color: rgba(0, 0, 0, 0.87);
  font-weight: 500;
  padding: 0 0 5px 0;
  font-size: 1em;
`;

const EditDatabaseConnectionModal = ({
  isOpen,
  onClose,
  dbConnection,
  refreshChannel, // eric hack
  ...mutations
}) => {
  const [url, setUrl] = useState(dbConnection.url);
  const [name, setName] = useState(dbConnection.name);

  // if user and password are passed as empty strings they will not be updated in the db
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [showUrlError, setShowUrlError] = useState(false);
  const [showNameError, setShowNameError] = useState(false);
  const [showUserError, setShowUserError] = useState(false);
  const [showPasswordError, setShowPasswordError] = useState(false);
  const [isPrivate, setIsPrivate] = useState(dbConnection.isPrivate);
  const [isUpdatingCredentials, setIsUpdatingCredentials] = useState(false);

  const [showError, setShowError] = React.useState(false);
  const [errorText, setErrorText] = React.useState("");

  const resetFields = () => {
    setUser("");
    setPassword("");
    setUrl(dbConnection.url);
    setName(dbConnection.name);
    setIsUpdatingCredentials(false);
    setIsPrivate(dbConnection.isPrivate);
  };

  const resetErrors = () => {
    setShowUrlError(false);
    setShowNameError(false);
    setShowUserError(false);
    setShowPasswordError(false);
  };

  const onMutationSuccess = () => {
    // we don't need to refetch or update the cache because apollo will handle updates itself
    refreshChannel.refresh(); // eric hack    
    onClose();
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

  const handleSubmit = () => {
    if (
      // if not updating credentials only check name and url
      (!isUpdatingCredentials &&
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
        ])) ||
      // if updating credentials check all params
      (isUpdatingCredentials &&
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
        ]))
    ) {
      const variables = {
        id: dbConnection.id,
        properties: { name, url, user, password, isPrivate },
      };
      runMutation(
        mutations.EDIT_DB_CONNECTION,
        variables,
        [{ query: ALL_ENGINES_FOR_USER }],
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
      buttonName={"Submit"}
      size={"tiny"}
      onSubmit={() => {
        resetErrors();
        handleSubmit();
      }}
    >
      <Form>
        <Form.Input
          label="DB Connection Name"
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
        <UpdateDBDomain>
          <TextBold>Private</TextBold>
          <Radio
            toggle
            checked={isPrivate}
            onChange={() => setIsPrivate(!isPrivate)}
          />
        </UpdateDBDomain>
        {!isUpdatingCredentials && (
          <UpdateCredentials
            onClick={() => {
              setIsUpdatingCredentials(true);
            }}
          >
            Update Credentials
          </UpdateCredentials>
        )}
        {isUpdatingCredentials && (
          <>
            <Form.Input
              label="Username"
              placeholder="new username"
              value={user ? user : ""}
              error={showUserError}
              onChange={(e, data) => {
                setUser(data.value);
                setShowUserError(false);
              }}
            />
            <Form.Input
              label="Password"
              placeholder="new password"
              value={password ? password : ""}
              error={showPasswordError}
              type="password"
              onChange={(e, data) => {
                setPassword(data.value);
                setShowPasswordError(false);
              }}
            />
            <UpdateCredentials
              onClick={() => {
                setUser("");
                setPassword("");
                setIsUpdatingCredentials(false);
              }}
            >
              Don't Update Credentials
            </UpdateCredentials>
          </>
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

EditDatabaseConnectionModal.propTypes = {
  dbConnection: PropTypes.shape({
    labels: PropTypes.array,
    id: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    isPrivate: PropTypes.bool.isRequired,
    dbInfo: PropTypes.shape({
      hasApoc: PropTypes.bool.isRequired,
      isConnected: PropTypes.bool.isRequired,
      license: PropTypes.oneOf(["ENTERPRISE", "COMMUNITY", "NA"]),
    }),
    engines: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
      })
    ).isRequired,
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
  graphql(EDIT_DB_CONNECTION, {
    name: "EDIT_DB_CONNECTION",
  })
)(EditDatabaseConnectionModal);
