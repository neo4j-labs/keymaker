import React, { useState } from "react";
import PropTypes from "prop-types";
import styled from "styled-components";

import AddRoleModal from "./AddRoleModal";
import Button from "../../components/Button";
import MessageModal from "../../components/MessageModal";

import "../../App.css";

export const HeaderWrapper = styled.div`
  min-width: 225px
  margin: 25px 20% 25px 20%;
  display: flex;
  justify-content: space-between;
`;

const Header = ({ nodeId, type, userList, currentUser }) => {
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  const openAddUserModal = () => setAddUserModalOpen(true);
  const closeAddUserModal = () => setAddUserModalOpen(false);

  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const closePermissionsModal = () => setIsPermissionsModalOpen(false);
  const openPermissionsModal = () => setIsPermissionsModalOpen(true);

  return (
    <>
      <MessageModal
        isOpen={isPermissionsModalOpen}
        onClose={() => {
          closePermissionsModal();
        }}
        title={"Insufficient Permissions"}
        message={"You don't have permission to do that."}
      />
      <AddRoleModal
        type={type}
        nodeId={nodeId}
        userList={userList.map((u) => (u.user ? u.user.email : ""))}
        isOpen={addUserModalOpen}
        onClose={closeAddUserModal}
      />
      <HeaderWrapper>
        <div />
        <Button
          noShadow
          lightenOnHover
          className="blue-background white text-normal"
          onClick={() => {
            if (currentUser.role === "OWNER" || currentUser.isAdmin) {
              openAddUserModal();
            } else {
              openPermissionsModal();
            }
          }}
        >
          Add User
        </Button>
      </HeaderWrapper>
    </>
  );
};

Header.propTypes = {
  type: PropTypes.string.isRequired,
  nodeId: PropTypes.string.isRequired,
};

export default Header;
