import React, { useState } from "react";
import PropTypes from "prop-types";
import styled from "styled-components";
import { Mutation } from "@apollo/client/react/components";
import { List, Dropdown, Icon } from "semantic-ui-react";

import Button from "../../components/Button";
import UserPortrait from "../../components/UserPortrait";

import LeaveModal from "../../components/DeleteModal";
import RemoveModal from "../../components/DeleteModal";
import MessageModal from "../../components/MessageModal";
import EditRoleModal from "./EditRoleModal";

import "../../App.css";
import history from "../../auth/history";

import {
  LEAVE_DB,
  LEAVE_ENGINE,
  REMOVE_USER_ROLE_FROM_DB,
  REMOVE_USER_ROLE_FROM_ENGINE,
  GET_USER_ROLES_FOR_DB,
  GET_USER_ROLES_FOR_ENGINE,
} from "../../graphql/user";
import { ALL_ENGINES_FOR_USER } from "../../graphql/engine";
import { ALL_DB_CONNECTIONS_FOR_USER } from "../../graphql/dbConnection";

const ListWrapper = styled.div`
  min-width: 225px
  border-radius: 3px;
  background-color: white;
  margin: 25px 20% 25px 20%;
`;

const ListItemContent = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 15px 25px 15px 25px;
`;

const ListLeftItems = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  overflow: hidden;
  margin-right: 15px;
`;

const ListLeftItem = styled.div`
  margin-right: 10px;
`;

const ListRightItems = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const UserList = ({ userList, currentUser, nodeId, type }) => {
  let rootQuery = {};
  let leaveMutation = {};
  let removeMutation = {};
  let refetchQuery = {};
  if (type === "engine") {
    leaveMutation = LEAVE_ENGINE;
    removeMutation = REMOVE_USER_ROLE_FROM_ENGINE;
    rootQuery = GET_USER_ROLES_FOR_ENGINE;
    refetchQuery = ALL_ENGINES_FOR_USER;
  }
  if (type === "db") {
    leaveMutation = LEAVE_DB;
    removeMutation = REMOVE_USER_ROLE_FROM_DB;
    rootQuery = GET_USER_ROLES_FOR_DB;
    refetchQuery = ALL_DB_CONNECTIONS_FOR_USER;
  }

  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const closeLeaveModal = () => setIsLeaveModalOpen(false);
  const openLeaveModal = () => setIsLeaveModalOpen(true);

  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const closeRemoveModal = () => setIsRemoveModalOpen(false);
  const openRemoveModal = () => setIsRemoveModalOpen(true);

  const [isEditRoleModalOpen, setIsEditRoleModalOpen] = useState(false);
  const closeEditRoleModal = () => setIsEditRoleModalOpen(false);
  const openEditRoleModal = () => setIsEditRoleModalOpen(true);

  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const closePermissionsModal = () => setIsPermissionsModalOpen(false);
  const openPermissionsModal = () => setIsPermissionsModalOpen(true);

  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);

  const [mutationVars, setMutationVars] = useState({});

  const dropdownOptionsOne = [
    {
      key: "remove",
      text: "remove",
      value: "remove",
      selected: false,
    },
    {
      key: "edit role",
      text: "edit role",
      value: "edit role",
    },
  ];

  const dropdownOptionsTwo = [
    {
      key: "leave",
      text: "leave",
      value: "leave",
      selected: false,
    },
  ];

  const handleDropdownClick = (value, idx) => {
    const role = userList[idx].role;
    const email = userList[idx].user.email;
    if (value === "remove") {
      if (currentUser.isAdmin || currentUser.role === "OWNER") {
        setMutationVars({ input: { role, email, id: nodeId } });
        openRemoveModal();
      } else {
        openPermissionsModal();
      }
    } else if (value === "edit role") {
      if (currentUser.isAdmin || currentUser.role === "OWNER") {
        setMutationVars({ role, email, nodeId });
        openEditRoleModal();
      } else {
        openPermissionsModal();
      }
    } else if (value === "leave") {
      const owners = userList.filter((user) => user.role === "OWNER");
      if (owners.length === 1 && currentUser.role === "OWNER") {
        setIsMessageModalOpen(true);
      } else {
        setMutationVars({ input: { role, email, id: nodeId } });
        openLeaveModal();
      }
    }
  };

  const updateCacheOnRemove = (store, data) => {
    // get the removed user returned by the mutation
    // TODO: figure out why there is a nested data object here
    const removedUserRole = data.data.userRole;
    // get the current userRoles object from the cache
    const { userRoles } = store.readQuery({
      query: rootQuery,
      variables: { id: nodeId },
    });
    // remove the user from the userRoles user list
    const updatedUserRoles = userRoles.filter((obj) => {
      return obj.user.email !== removedUserRole.user.email;
    });
    // update the user roles object with the new user list and write back to the cache
    store.writeQuery({
      query: rootQuery,
      variables: { id: nodeId },
      data: { userRoles: updatedUserRoles },
    });
  };

  const updateCacheOnLeave = (store, data) => {
    // get the removed user returned by the mutation
    // TODO: figure out why there is a nested data object here
    const removedUserRole = data.data.userRole;
    // get the current userRoles object from the cache
    const { userRoles } = store.readQuery({
      query: rootQuery,
      variables: { id: nodeId },
    });
    // remove the user from the userRoles user list
    const updatedUserRoles = userRoles.users.filter((obj) => {
      return obj.user.email !== removedUserRole.user.email;
    });
    // update the user roles object with the new user list and write back to the cache
    userRoles.users = updatedUserRoles;
    store.writeQuery({
      query: rootQuery,
      variables: { id: nodeId },
      data: { userRoles },
    });
  };

  return (
    <>
      <MessageModal
        isOpen={isMessageModalOpen}
        onClose={() => {
          setIsMessageModalOpen(false);
        }}
        title={"Uh Oh,"}
        message={
          "You can't leave an engine/db connection if you are the only owner."
        }
      />
      <MessageModal
        isOpen={isPermissionsModalOpen}
        onClose={() => {
          closePermissionsModal();
        }}
        title={"Insufficient Permissions"}
        message={"You don't have permission to do that."}
      />
      <Mutation
        mutation={removeMutation}
        update={updateCacheOnRemove}
        refetchQueries={[{ query: refetchQuery }]}
      >
        {(removeUserRoleFromNode) => (
          <RemoveModal
            buttonName="Remove"
            isOpen={isRemoveModalOpen}
            headerContent={"Remove User"}
            content={
              "Are you sure you want to remove this user? This is not reversible."
            }
            onClose={closeRemoveModal}
            onDelete={() => removeUserRoleFromNode({ variables: mutationVars })}
          />
        )}
      </Mutation>
      <Mutation
        mutation={leaveMutation}
        update={updateCacheOnLeave}
        refetchQueries={[{ query: refetchQuery }]}
        onCompleted={() => history.replace("/")}
      >
        {(leaveNode) => (
          <LeaveModal
            buttonName="Leave"
            isOpen={isLeaveModalOpen}
            headerContent={"Leave"}
            content={"Are you sure you want to leave? This is not reversible."}
            onClose={closeLeaveModal}
            onDelete={() => leaveNode({ variables: mutationVars })}
          />
        )}
      </Mutation>
      <EditRoleModal
        type={type}
        nodeId={nodeId}
        isOpen={isEditRoleModalOpen}
        onClose={closeEditRoleModal}
        mutationVars={mutationVars}
      />
      <ListWrapper>
        <List divided relaxed size="large">
          {userList.map((user, idx) => {
            const userInfo = user.user;
            const isCurrentUser = userInfo.isCurrentUser;
            return (
              <List.Item key={idx}>
                <ListItemContent>
                  <ListLeftItems>
                    <ListLeftItem>
                      <UserPortrait
                        email={userInfo.email}
                        picture={userInfo.picture}
                      />
                    </ListLeftItem>
                    <ListLeftItem>
                      <div className="text-small text-normal blue hidden-on-mobile">
                        {userInfo.email}
                      </div>
                    </ListLeftItem>
                  </ListLeftItems>
                  <ListRightItems>
                    <div className="text-small text-thin grey margin-right-small">
                      {user.role.toLowerCase()}
                    </div>
                    <Dropdown
                      icon={null}
                      value={null}
                      selectOnBlur={false}
                      pointing="top right"
                      trigger={
                        <Button
                          narrow
                          darkenOnHover
                          className="hover text-thin text-small light-grey-background black margin-left-small"
                        >
                          <Icon name="ellipsis horizontal"></Icon>
                        </Button>
                      }
                      options={
                        isCurrentUser ? dropdownOptionsTwo : dropdownOptionsOne
                      }
                      onChange={(e, { value }) => {
                        handleDropdownClick(value, idx);
                      }}
                    />
                  </ListRightItems>
                </ListItemContent>
              </List.Item>
            );
          })}
        </List>
      </ListWrapper>
    </>
  );
};

UserList.propTypes = {
  userList: PropTypes.arrayOf(
    PropTypes.shape({
      role: PropTypes.string.isRequired,
      user: PropTypes.shape({
        email: PropTypes.string.isRequired,
        picture: PropTypes.string,
      }),
    })
  ).isRequired,
  type: PropTypes.string.isRequired,
  nodeId: PropTypes.string.isRequired,
  currentUser: PropTypes.object.isRequired,
};

export default UserList;
