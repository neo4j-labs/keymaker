import React, { useState } from "react";
import styled from "styled-components";
import { Icon } from "semantic-ui-react";
import * as compose from "lodash.flowright";
import { graphql } from "@apollo/client/react/hoc";
import { Link } from "react-router-dom";

import Button from "../../components/Button";
import Divider from "../../components/VerticalDivider";
import ImportDropdown from "./ImportDropdown";
import ExportDropdown from "./ExportDropdown";
import EditEngineModal from "./EditEngineModal";
import JobSchedulerModal from "./JobSchedulerModal";
import UserPortrait from "../../components/UserPortrait";
import MessageModal from "./../../components/MessageModal";

import { EDIT_ENGINE } from "../../graphql/engine";

import { runMutation } from "../../util/helper";

import "../../App.css";

const NavbarContainer = styled.div`
  min-width: 100%;
  height: 50px;
  display: flex;
  align-content: flex-start;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
`;

const ItemRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-top: 6px;
  margin-bottom: 6px;
`;

const UserGroup = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const EngineName = styled.span``;

const EngineHeader = ({ engine, ...mutations }) => {
  const { id, name, users, isPrivate, dbConnection } = engine;

  const [buttonDisabled, setButtonDisabled] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isJobSchedulerModalOpen, setIsJobSchedulerModalOpen] = useState(false);

  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const closePermissionsModal = () => setIsPermissionsModalOpen(false);
  const openPermissionsModal = () => setIsPermissionsModalOpen(true);

  const handleDomainSubmit = () => {
    const variables = {
      id: id,
      dbConnectionID: dbConnection.id,
      input: {
        isPrivate: !isPrivate,
      },
    };
    setButtonDisabled(true);
    runMutation(
      mutations.EDIT_ENGINE,
      variables,
      [],
      () => {
        setButtonDisabled(false);
      },
      () => {
        setButtonDisabled(false);
      },
      undefined
    );
  };

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
      <JobSchedulerModal
        isOpen={isJobSchedulerModalOpen}
        onClose={() => setIsJobSchedulerModalOpen(false)}
        engineID={id}
      />
      <EditEngineModal
        engine={engine}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
      <NavbarContainer>
        <ItemRow>
          <Icon name="rocket" className="text-large black"></Icon>
          <EngineName className="text-large text-bold margin-left-small margin-bottom-tiny">
            {name}
          </EngineName>
          <Divider className="grey-background" height="15px" />
          <Button
            darkenOnHover
            className="hover text-small text-normal white-background black"
            onClick={() => {
              if (engine.canCurrentUserEdit) {
                setIsEditModalOpen(true);
              } else {
                openPermissionsModal();
              }
            }}
          >
            <Icon name="setting" className="black"></Icon>
            <span className="margin-left-tiny">Edit</span>
          </Button>
          <Divider className="grey-background" height="15px" />
          <Button
            darkenOnHover
            disabled={buttonDisabled}
            className="hover text-small text-normal white-background black"
            onClick={() => handleDomainSubmit()}
          >
            {isPrivate && (
              <>
                <Icon name="lock" className="black"></Icon>
                <span className="margin-left-tiny">Private</span>
              </>
            )}
            {!isPrivate && (
              <>
                <Icon name="lock open" className="black"></Icon>
                <span className="margin-left-tiny ">Public</span>
              </>
            )}
          </Button>
          <Divider className="grey-background" height="15px" />
          <UserGroup>
            {users.slice(0, 3).map((user, idx) => (
              <UserPortrait
                key={idx}
                email={user.user.email}
                picture={user.user.picture}
              />
            ))}
            {users.length > 3 && (
              <div
                className="grey-background-opaque"
                style={{
                  height: "35px",
                  borderRadius: "17.5px",
                  padding: "0px 12px",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                + {users.length - 3}
              </div>
            )}
            <Link to={"/engine/" + id + "/collaborators"}>
              <Button
                narrow
                darkenOnHover
                className=" hover margin-left-small text-small text-normal white-background black"
              >
                Invite
              </Button>
            </Link>
          </UserGroup>
        </ItemRow>
        <ItemRow>
          <ImportDropdown engine={engine} />
          <ExportDropdown engine={engine} />
          <Divider className="grey-background" height="15px" />
          <Button
            darkenOnHover
            className="hover text-small text-normal white-background black"
            onClick={() => setIsJobSchedulerModalOpen(true)}
          >
            <Icon name="clock outline" className="black"></Icon>
            <span className="margin-left-tiny">Job Scheduler</span>
          </Button>
        </ItemRow>
      </NavbarContainer>
    </>
  );
};

export default compose(
  graphql(EDIT_ENGINE, {
    name: "EDIT_ENGINE",
  })
)(EngineHeader);
