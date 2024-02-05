import React from "react";
import PropTypes from "prop-types";
import { Query } from "@apollo/client/react/components";
import Header from "./Header";
import UserList from "./UserList";

import history from "../../auth/history";

import {
  GET_USER_ROLES_FOR_DB,
  GET_USER_ROLES_FOR_ENGINE,
} from "../../graphql/user";

const PermissionsScreen = ({ type, ...props }) => {
  const nodeId = props.match.params.id;
  let query = {};
  if (type === "engine") {
    query = GET_USER_ROLES_FOR_ENGINE;
  }
  if (type === "db") {
    query = GET_USER_ROLES_FOR_DB;
  }

  return (
    <Query query={query} variables={{ id: nodeId }}>
      {({ loading, error, data }) => {
        if (loading) return <></>;
        if (error) return <></>;
        const userRoles = data ? data.userRoles : [];
        const currentUser = userRoles.find((role) => role.user.isCurrentUser);
        if (currentUser) {
          return (
            <>
              <Header
                nodeId={nodeId}
                type={type}
                userList={userRoles}
                currentUser={currentUser}
              />
              <UserList
                type={type}
                nodeId={nodeId}
                userList={userRoles}
                currentUser={currentUser}
              />
            </>
          );
        } else {
          history.replace("/");
          return <></>;
        }
      }}
    </Query>
  );
};

PermissionsScreen.propTypes = {
  type: PropTypes.string.isRequired,
};

export default PermissionsScreen;
