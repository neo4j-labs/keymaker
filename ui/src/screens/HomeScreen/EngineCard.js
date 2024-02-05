import React, { useState } from "react";
import PropTypes from "prop-types";
import styled from "styled-components";
import { Mutation } from "@apollo/client/react/components";
import { Icon } from "semantic-ui-react";
import { Query } from "@apollo/client/react/components";
import Card from "./../../components/Card";
import Button from "./../../components/Button";
import IconPopup from "./../../components/IconPopup";
import TextPopup from "./../../components/TextPopup";
import DeleteModal from "./../../components/DeleteModal";
import MessageModal from "./../../components/MessageModal";
import VerticalDivider from "../../components/VerticalDivider";
import HorizontalDivider from "../../components/HorizontalDivider";

import history from "../../auth/history";

import { parseDBInfo } from "../../util/helper";
import {
  ALL_DB_CONNECTIONS_FOR_USER,
  GET_DB_INFO,
} from "../../graphql/dbConnection";
import { DELETE_ENGINE, ALL_ENGINES_FOR_USER } from "../../graphql/engine";

const ContentWrapper = styled.div`
  height: 100%;
  display: flex;
  padding: 12px 12px;
  flex-direction: column;
  justify-content: space-between;
`;

const HeaderWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const BodyWrapper = styled.div`
  width: 100%;
  display-flex;
  flex-direction: column;
  padding: 0px 0px;
`;

const TitleWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`;

const Date = styled.div``;

const DBConnection = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`;

const Title = styled.div`
  margin: 0px 5px 0px 0px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  line-height: 1.25em;
  max-height: 2.5;
`;

const Description = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  overflow: hidden;
  padding: 0px 12px;
  text-overflow: ellipsis;
  text-align: center;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  line-height: 1.3em;
  max-height: 2.5;
`;

const FooterWrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

const FooterContent = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-evenly;
`;

const FooterItem = styled.div`
  height: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const ConnectionStatus = styled.div`
  color: ${(props) => props.status.color};
`;

const EngineCard = ({ engine }) => {
  const [isDeleteWarningOpen, setIsDeleteWarningOpen] = useState(false);

  const openDeleteWarning = () => setIsDeleteWarningOpen(true);
  const closeDeleteWarning = () => setIsDeleteWarningOpen(false);

  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const closePermissionsModal = () => setIsPermissionsModalOpen(false);
  const openPermissionsModal = () => setIsPermissionsModalOpen(true);

  const {
    name,
    description,
    id,
    dbConnection,
    phases,
    users,
    createdAt,
  } = engine;

  const updateCacheOnDelete = (store, data) => {
    // get the deleted db connection returned by the mutation
    const deletedEngine = data["engine"];
    // update the db connections in the cache
    const { engines } = store.readQuery({
      query: ALL_ENGINES_FOR_USER,
    });
    const updatedEngines = engines.filter((obj) => {
      return obj.id !== deletedEngine.id;
    });
    store.writeQuery({
      query: ALL_ENGINES_FOR_USER,
      data: { engines: updatedEngines },
    });
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
      <Mutation
        mutation={DELETE_ENGINE}
        refetchQueries={[{ query: ALL_DB_CONNECTIONS_FOR_USER }]}
        update={(store, { data }) => {
          try {
            updateCacheOnDelete(store, data);
          } catch (err) {
            console.log(err);
          }
        }}
      >
        {(deleteEngine) => (
          <DeleteModal
            isOpen={isDeleteWarningOpen}
            headerContent="Delete Engine"
            content="Are you sure you want to delete this engine? All data will be lost, including all phases within the engine."
            onClose={closeDeleteWarning}
            onDelete={() => deleteEngine({ variables: { id } })}
          />
        )}
      </Mutation>
      <Card
        height="280px"
        borderOnHover
        pointerOnHover
        borderColor="rgb(0, 139, 193)"
        onClick={() => history.push("/engine/" + id)}
      >
        <ContentWrapper>
          <HeaderWrapper>
            <Date className="grey text-thin">{createdAt}</Date>
            <Button
              narrow
              width="35px"
              height="35px"
              borderRadius="17.5px"
              lightenOnHover
              className="light-grey-background"
              onClick={(e) => {
                if (!engine.canCurrentUserDelete) {
                  openPermissionsModal();
                } else {
                  openDeleteWarning();
                }
                e.cancelBubble = true;
                if (e.stopPropagation) e.stopPropagation();
              }}
            >
              <Icon name="trash alternate outline" className="grey"></Icon>
            </Button>
          </HeaderWrapper>
          <BodyWrapper>
            <TitleWrapper className="margin-bottom-small">
              <Title className="black text-large text-bold margin-right-tiny">
                <TextPopup text={name}></TextPopup>
              </Title>
              <Query query={GET_DB_INFO} variables={{ id: (dbConnection) ? dbConnection.id : null }}>
                {({ loading, error, data }) => {
                  if (loading)
                    return (
                      <ConnectionStatus
                        status={{
                          color: "#ebd000",
                          message: "Loading",
                          icon: "dot circle",
                        }}
                      >
                        <IconPopup
                          iconSize="large"
                          iconName="dot circle"
                          popupContent="Loading"
                        />
                      </ConnectionStatus>
                    );
                  if (error)
                    return (
                      <ConnectionStatus
                        status={{
                          color: "#d84242",
                          message: "Offline",
                          icon: "times circle",
                        }}
                      >
                        <IconPopup
                          iconSize="large"
                          iconName="times circle"
                          popupContent="Offline"
                        />
                      </ConnectionStatus>
                    );
                  const dbInfo = (data.dbConnection) ? data.dbConnection.dbInfo : {};
                  const status = parseDBInfo(dbInfo);
                  return (
                    <ConnectionStatus status={status}>
                      <IconPopup
                        iconSize="large"
                        iconName={status.icon}
                        popupContent={status.message}
                      />
                    </ConnectionStatus>
                  );
                }}
              </Query>
            </TitleWrapper>
            <DBConnection className="margin-bottom-med">
              <Icon name="database" className="blue margin-bottom-small" />
              <div className="blue margin-left-tiny margin-top-tiny text-thin">
                {dbConnection === null
                  ? "Connect to a Database"
                  : dbConnection.name}
              </div>
            </DBConnection>
            <Description className="dark-grey text-thin margin-top-small">
              <TextPopup
                text={description !== "" ? description : ".\n.\n.\n"}
              />
            </Description>
          </BodyWrapper>
          <FooterWrapper>
            <HorizontalDivider className="light-grey-background" width="100%" />
            <FooterContent>
              <FooterItem>
                <div className="grey text-thin text-small">Users</div>
                <div className="black text-med text-bold">{users.length}</div>
              </FooterItem>
              <VerticalDivider
                noMargin
                height="30px"
                className="light-grey-background"
              />
              <FooterItem>
                <div className="grey text-thin text-small">Phases</div>
                <div className="black text-med text-bold">{phases.length}</div>
              </FooterItem>
            </FooterContent>
          </FooterWrapper>
        </ContentWrapper>
      </Card>
    </>
  );
};

EngineCard.propTypes = {
  engine: PropTypes.shape({
    name: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    isPrivate: PropTypes.bool.isRequired,
    users: PropTypes.array.isRequired,
    dbConnection: PropTypes.shape({
      labels: PropTypes.array,
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    }),
  }).isRequired,
};

export default EngineCard;
