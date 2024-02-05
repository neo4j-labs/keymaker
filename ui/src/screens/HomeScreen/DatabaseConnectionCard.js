import React, { useState } from "react";
import PropTypes from "prop-types";
import styled from "styled-components";
import { Mutation } from "@apollo/client/react/components";
import { Query } from "@apollo/client/react/components";
import { Link } from "react-router-dom";
import { Icon } from "semantic-ui-react";

import Card from "./../../components/Card";
import Button from "../../components/Button";
import IconPopup from "./../../components/IconPopup";
import TextPopup from "./../../components/TextPopup";
import DeleteModal from "./../../components/DeleteModal";
import MessageModal from "./../../components/MessageModal";
import VerticalDivider from "../../components/VerticalDivider";
import HorizontalDivider from "../../components/HorizontalDivider";
import EditDatabaseConnectionModal from "./EditDatabaseConnectionModal";

import "../../App.css";
import { parseDBInfo } from "../../util/helper";

import {
  GET_DB_INFO,
  DELETE_DB_CONNECTION,
  ALL_DB_CONNECTIONS_FOR_USER,
} from "../../graphql/dbConnection";

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
  flex-wrap: no-wrap;
`;

const Date = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const BodyWrapper = styled.div`
  width: 100%;
  display-flex;
  flex-direction: column;
  padding: 0px 0px;
`;

const TitleWrapper = styled.div`
  display: flex;
  flex-direction: column;
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

const VersionNumber = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
`;

const ConnectionURL = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  overflow: hidden;
  padding: 0px 12px;
  text-overflow: ellipsis;
  text-align: center;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  line-height: 1.25em;
  max-height: 1.25;
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

const DatabaseConnectionCard = ({ dbConnection }) => {
  const [isDeleteWarningOpen, setIsDeleteWarningOpen] = useState(false);

  const [isEditingDatabase, setIsEditingDatabase] = useState(false);
  const closeEditDatabaseModal = () => setIsEditingDatabase(false);
  const openEditDatabaseModal = () => setIsEditingDatabase(true);

  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const closePermissionsModal = () => setIsPermissionsModalOpen(false);
  const openPermissionsModal = () => setIsPermissionsModalOpen(true);

  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);

  var { id, name, url, users, createdAt, engines } = dbConnection;

  const updateCacheOnDelete = (store, data) => {
    // get the deleted db connection returned by the mutation
    const deletedDBConnection = data["dbConnection"];
    // update thedb connections in the cache
    const { dbConnections } = store.readQuery({
      query: ALL_DB_CONNECTIONS_FOR_USER,
    });
    const updatedDBConnections = dbConnections.filter((obj) => {
      return obj.id !== deletedDBConnection.id;
    });
    store.writeQuery({
      query: ALL_DB_CONNECTIONS_FOR_USER,
      data: { dbConnections: updatedDBConnections },
    });
  };

  /* 
    Eric 05/25/2021: I need a way to trigger a refetch of the database connection status
    - Therefore I need to call refetch(), but only under the Query that contains GET_DB_INFO
    - However, I need to call this on the successful completion of data being saved under 
       EditDatabaseConnectionModal. There may be a way to do this through the Apollo cache, 
       but I don't know how to do that. Alternatively, some re-nesting would have to occur to 
       place EditDatabaseConnectionModel under the Query.  I'm not sure how that would affect the layout.
    - My solution is going to be hacky for now, hopefully someone can make this better later on.
  */
  var refreshChannel = (function createRefreshChannel() {
    var apolloRefetchFunc;

    function refresh() {
      apolloRefetchFunc();
    }

    return {
      setApolloRefetchFunc: function (refetchFunc) {
        apolloRefetchFunc = refetchFunc;
      },
      refresh: refresh,
    };
  })();

  return (
    <>
      <EditDatabaseConnectionModal
        isOpen={isEditingDatabase}
        onClose={closeEditDatabaseModal}
        dbConnection={dbConnection}
        refreshChannel={refreshChannel} // eric hack
      />
      <MessageModal
        isOpen={isMessageModalOpen}
        onClose={() => {
          setIsMessageModalOpen(false);
        }}
        title={"Uh Oh,"}
        message={
          "You can't delete that database connection, it has engines associated with it."
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
        mutation={DELETE_DB_CONNECTION}
        refetchQueries={[]}
        update={(store, { data }) => {
          try {
            updateCacheOnDelete(store, data);
          } catch (err) {
            console.log(err);
          }
        }}
      >
        {(deleteConnection) => (
          <DeleteModal
            isOpen={isDeleteWarningOpen}
            isEditing={false}
            headerContent="Delete Connection"
            content="Are you sure you want to delete this database connection? This is not reversible."
            onClose={() => setIsDeleteWarningOpen(false)}
            onDelete={() => deleteConnection({ variables: { id } })}
          />
        )}
      </Mutation>
      <Card height="280px">
        <ContentWrapper>
          <HeaderWrapper>
            <Date className="grey text-thin hidden-on-mobile">{createdAt}</Date>
            <ButtonGroup>
              <Button
                narrow
                width="35px"
                height="35px"
                borderRadius="17.5px"
                lightenOnHover
                className="light-grey-background margin-right-tiny"
                onClick={() => {
                  if (dbConnection.canCurrentUserEdit) {
                    openEditDatabaseModal();
                  } else {
                    openPermissionsModal();
                  }
                }}
              >
                <Icon name="pencil" className="grey"></Icon>
              </Button>
              <Link to={"/db/" + id + "/collaborators"}>
                <Button
                  narrow
                  width="35px"
                  height="35px"
                  borderRadius="17.5px"
                  lightenOnHover
                  className="light-grey-background margin-right-tiny"
                >
                  <Icon name="user outline" className="grey"></Icon>
                </Button>
              </Link>
              <Button
                narrow
                width="35px"
                height="35px"
                borderRadius="17.5px"
                lightenOnHover
                className="light-grey-background"
                onClick={(e) => {
                  if (!dbConnection.canCurrentUserDelete) {
                    openPermissionsModal();
                  } else if (engines.length !== 0) {
                    setIsMessageModalOpen(true);
                  } else {
                    setIsDeleteWarningOpen(true);
                  }
                }}
              >
                <Icon name="trash alternate outline" className="grey"></Icon>
              </Button>
            </ButtonGroup>
          </HeaderWrapper>
          <BodyWrapper>
            <Query query={GET_DB_INFO} variables={{ id: id }}>
              {({ loading, error, data, refetch }) => {
                refreshChannel.setApolloRefetchFunc(refetch); // eric hack
                if (loading)
                  return (
                    <TitleWrapper className="margin-bottom-small">
                      <div style={{ display: "flex", flexDirection: "row" }}>
                        <Title className="black text-large text-bold margin-right-tiny">
                          <TextPopup text={name}></TextPopup>
                        </Title>
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
                      </div>
                    </TitleWrapper>
                  );
                if (error)
                  return (
                    <TitleWrapper className="margin-bottom-small">
                      <div style={{ display: "flex", flexDirection: "row" }}>
                        <Title className="black text-large text-bold margin-right-tiny">
                          <TextPopup text={name}></TextPopup>
                        </Title>
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
                      </div>
                    </TitleWrapper>
                  );
                const dbInfo = data.dbConnection.dbInfo;
                const status = parseDBInfo(dbInfo);
                return (
                  <TitleWrapper className="margin-bottom-small">
                    <div style={{ display: "flex", flexDirection: "row" }}>
                      <Title className="black text-large text-bold margin-right-tiny">
                        <TextPopup text={name}></TextPopup>
                      </Title>
                      <ConnectionStatus status={status}>
                        <IconPopup
                          iconSize="large"
                          iconName={status.icon}
                          popupContent={status.message}
                        />
                      </ConnectionStatus>
                    </div>
                    <div style={{ height: "12px" }} />
                    <VersionNumber className="blue text-thin margin-bottom-med">
                      ({dbInfo.versions[0]})
                    </VersionNumber>
                  </TitleWrapper>
                );
              }}
            </Query>
            <ConnectionURL className="grey text-thin">
              <TextPopup text={url} />
            </ConnectionURL>
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
                <div className="grey text-thin text-small">Engines</div>
                <div className="black text-med text-bold">{engines.length}</div>
              </FooterItem>
            </FooterContent>
          </FooterWrapper>
        </ContentWrapper>
      </Card>
    </>
  );
};

DatabaseConnectionCard.propTypes = {
  dbConnection: PropTypes.shape({
    labels: PropTypes.array,
    id: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    isPrivate: PropTypes.bool.isRequired,
    // dbInfo: PropTypes.shape({
    //   hasApoc: PropTypes.bool.isRequired,
    //   isConnected: PropTypes.bool.isRequired,
    //   license: PropTypes.oneOf(["ENTERPRISE", "COMMUNITY", "NA"]),
    // }),
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
  }),
};

export default DatabaseConnectionCard;
