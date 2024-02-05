import React, { useState } from "react";
import PropTypes from "prop-types";
import { graphql } from "@apollo/client/react/hoc";
import { Form, Message } from "semantic-ui-react";
import * as compose from "lodash.flowright";

import FormModal from "../../components/FormModal";

import { runMutation } from "../../util/helper";

import {
  EDIT_USER_ROLE_ON_DB,
  EDIT_USER_ROLE_ON_ENGINE,
  GET_USER_ROLES_FOR_DB,
  GET_USER_ROLES_FOR_ENGINE
} from "../../graphql/user";

const EditRoleModal = ({
  type,
  nodeId,
  isOpen,
  onClose,
  mutationVars,
  ...mutations
}) => {
  let mutation = "";
  let rootQuery = {};
  if (type === "engine") {
    mutation = "EDIT_USER_ROLE_ON_ENGINE";
    rootQuery = GET_USER_ROLES_FOR_ENGINE;
  }
  if (type === "db") {
    mutation = "EDIT_USER_ROLE_ON_DB";
    rootQuery = GET_USER_ROLES_FOR_DB;
  }

  const [role, setRole] = useState(mutationVars.role);

  const [showError, setShowError] = React.useState(false);
  const [errorText, setErrorText] = React.useState("");

  const roleOptions = [
    {
      key: "Viewer",
      text: "Viewer",
      value: "VIEWER"
    },
    {
      key: "Member",
      text: "Member",
      value: "MEMBER"
    },
    {
      key: "Owner",
      text: "Owner",
      value: "OWNER"
    }
  ];

  const onMutationSuccess = () => {
    onClose();
  };

  const onMutationError = error => {
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
    const newRole = data["userRole"];
    // update the engines in the cache
    const { userRoles } = store.readQuery({
      query: rootQuery,
      variables: { id: nodeId }
    });
    // grab the user role to update
    let updatedRole = userRoles.find(
      role => role.user.email === newRole.user.email
    );
    // update the role and write back to the cache
    updatedRole.role = newRole.role;
    store.writeQuery({
      query: rootQuery,
      variables: { id: nodeId },
      data: { userRoles }
    });
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      buttonName="Submit"
      size={"tiny"}
      onSubmit={() => {
        const email = mutationVars.email;
        const nodeId = mutationVars.nodeId;
        const variables = { input: { id: nodeId, email, role } };
        runMutation(
          mutations[mutation],
          variables,
          [],
          onMutationError,
          onMutationSuccess,
          updateCache
        );
      }}
    >
      <Form>
        <Form.Dropdown
          label="role"
          selection
          options={roleOptions}
          defaultValue={mutationVars.role}
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

EditRoleModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  type: PropTypes.string.isRequired,
  nodeId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  mutationVars: PropTypes.object.isRequired
};

export default compose(
  graphql(EDIT_USER_ROLE_ON_ENGINE, {
    name: "EDIT_USER_ROLE_ON_ENGINE"
  }),
  graphql(EDIT_USER_ROLE_ON_DB, {
    name: "EDIT_USER_ROLE_ON_DB"
  })
)(EditRoleModal);
