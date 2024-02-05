import React, { useState } from "react";
import PropTypes from "prop-types";
import { graphql } from "@apollo/client/react/hoc";
import { Form, Message } from "semantic-ui-react";
import * as compose from "lodash.flowright";
import { ApolloConsumer } from "@apollo/client";
import FormModal from "../../components/FormModal";

import {
  runMutation,
  checkInputs,
  notNullUndefinedOrEmpty,
} from "../../util/helper";

import {
  ADD_USER_ROLE_TO_DB,
  SEARCH_USER_BY_EMAIL,
  ADD_USER_ROLE_TO_ENGINE,
  GET_USER_ROLES_FOR_DB,
  GET_USER_ROLES_FOR_ENGINE,
} from "../../graphql/user";
import { ALL_ENGINES_FOR_USER } from "../../graphql/engine";
import { ALL_DB_CONNECTIONS_FOR_USER } from "../../graphql/dbConnection";

const AddRoleModal = ({
  isOpen,
  onClose,
  nodeId,
  userList,
  type,
  ...mutations
}) => {
  // pick out the right mutation/root query
  let mutation = "";
  let rootQuery = {};
  let refetchQuery = {};
  if (type === "engine") {
    mutation = "ADD_USER_ROLE_TO_ENGINE";
    rootQuery = GET_USER_ROLES_FOR_ENGINE;
    refetchQuery = ALL_ENGINES_FOR_USER;
  }
  if (type === "db") {
    mutation = "ADD_USER_ROLE_TO_DB";
    rootQuery = GET_USER_ROLES_FOR_DB;
    refetchQuery = ALL_DB_CONNECTIONS_FOR_USER;
  }

  const [email, setEmail] = useState("");
  const [emails, setEmails] = useState([]);
  const [role, setRole] = useState("MEMBER");
  const [showEmailError, setShowEmailError] = useState(false);

  const [showError, setShowError] = React.useState(false);
  const [errorText, setErrorText] = React.useState("");

  const roleOptions = [
    {
      key: "Viewer",
      text: "Viewer",
      value: "VIEWER",
    },
    {
      key: "Member",
      text: "Member",
      value: "MEMBER",
    },
    {
      key: "Owner",
      text: "Owner",
      value: "OWNER",
    },
  ];

  const resetModal = () => {
    setEmail("");
    setEmails([]);
    setRole("MEMBER");
    setShowEmailError(false);
  };

  const onMutationSuccess = () => {
    onClose();
    resetModal();
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

  const updateCache = (store, data) => {
    // get the new user returned by the mutation
    const newUser = data["userRole"];
    newUser.user.isAdmin = false;
    newUser.user.isCurrentUser = false;
    // update the engines in the cache
    const { userRoles } = store.readQuery({
      query: rootQuery,
      variables: { id: nodeId },
    });
    userRoles.unshift(newUser);
    store.writeQuery({
      query: rootQuery,
      variables: { id: nodeId },
      data: { userRoles },
    });
  };

  const submitForm = () => {
    if (
      checkInputs([
        {
          input: email,
          functions: [notNullUndefinedOrEmpty],
          onError: () => {
            setShowEmailError(true);
          },
        },
      ])
    ) {
      const variables = { input: { id: nodeId, email, role } };
      runMutation(
        mutations[mutation],
        variables,
        [{ query: refetchQuery }],
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
        resetModal();
      }}
      buttonName="Submit"
      size={"tiny"}
      onSubmit={() => {
        submitForm();
      }}
    >
      <Form>
        <ApolloConsumer>
          {(client) => (
            <Form.Dropdown
              fluid
              search
              selection
              label="email"
              options={emails}
              selectOnBlur={false}
              error={showEmailError}
              value={email ? email : ""}
              onChange={(e, { value }) => {
                setEmail(value);
                setShowEmailError(false);
              }}
              onSearchChange={async (e, { value }) => {
                setEmail(value);
                setShowEmailError(false);
                const response = await client.query({
                  query: SEARCH_USER_BY_EMAIL,
                  variables: { email: value },
                });
                const d = response ? response.data : {};
                let users = d ? d.user : [];
                users = users.filter(function (item) {
                  return userList.indexOf(item.email) === -1;
                });
                const emailOptions = users.map((user) => ({
                  key: user.email,
                  text: user.email,
                  value: user.email,
                }));
                setEmails(emailOptions);
              }}
            />
          )}
        </ApolloConsumer>
        <Form.Dropdown
          label="role"
          selection
          options={roleOptions}
          defaultValue={role}
          placeholder="Select a Role"
          onChange={(e, { value }) => {
            setRole(value);
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

AddRoleModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  type: PropTypes.string.isRequired,
  nodeId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default compose(
  graphql(ADD_USER_ROLE_TO_ENGINE, {
    name: "ADD_USER_ROLE_TO_ENGINE",
  }),
  graphql(ADD_USER_ROLE_TO_DB, {
    name: "ADD_USER_ROLE_TO_DB",
  })
)(AddRoleModal);
