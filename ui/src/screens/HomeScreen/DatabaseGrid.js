import React, { useEffect, useState } from "react";
import { Query } from "@apollo/client/react/components";
import styled from "styled-components";
import { Form, Grid } from "semantic-ui-react";

import DatabaseConnectionCard from "./DatabaseConnectionCard";
import NewEntityButton from "../../components/NewEntityButton";
import CreateDatabaseConnectionModal from "./CreateDatabaseConnectionModal";

import { stringStartsWith } from "../../util/helper";

import { ALL_DB_CONNECTIONS_FOR_USER } from "../../graphql/dbConnection";

const GridContainer = styled.div`
  margin-top: 15px;
  margin-bottom: 15px;
`;

const DatabaseGrid = () => {
  const prevFilter = localStorage.getItem("dbGridFilter")
  const [isAddingDatabase, setIsAddingDatabase] = useState(false);
  const [filter, setFilter] = useState(prevFilter !== "null" ? prevFilter : "");
  const openAddDatabaseModal = () => setIsAddingDatabase(true);
  const closeAddDatabaseModal = () => setIsAddingDatabase(false);

  useEffect(() => {
    localStorage.setItem("dbGridFilter", filter)
  }, [filter])

  return (
    <Query query={ALL_DB_CONNECTIONS_FOR_USER} pollInterval={30000}>
      {({ loading, error, data, refetch }) => {
        if (loading) return <p>Loading...</p>;
        if (error) return <p>Error</p>;
        const { dbConnections: connections } = data;
        const dbConnections = connections ? connections : [];
        return (
          <div>
            <CreateDatabaseConnectionModal
              isOpen={isAddingDatabase}
              onClose={closeAddDatabaseModal}
              refetch={refetch}
            />
            <Grid columns="equal" stretched>
              <Grid.Column width={4}>
                <NewEntityButton
                  onClick={openAddDatabaseModal}
                  text="New Connection"
                />
              </Grid.Column>
              <Grid.Column>
                <Form.Input
                  fluid
                  placeholder="filter db connections"
                  value={filter}
                  onChange={(e, data) => {
                    setFilter(data.value);
                  }}
                />
              </Grid.Column>
            </Grid>
            <GridContainer>
              <Grid columns="equal">
                {dbConnections.map((dbConnection) => {
                  if (filter === "") {
                    return (
                      <Grid.Column
                        computer={4}
                        tablet={8}
                        mobile={16}
                        key={dbConnection.id}
                      >
                        <DatabaseConnectionCard
                          refetch={refetch}
                          dbConnection={dbConnection}
                        />
                      </Grid.Column>
                    );
                  } else if (stringStartsWith(filter, dbConnection.name)) {
                    return (
                      <Grid.Column
                        computer={4}
                        tablet={8}
                        mobile={16}
                        key={dbConnection.id}
                      >
                        <DatabaseConnectionCard
                          dbConnection={dbConnection}
                          refetch={refetch}
                        />
                      </Grid.Column>
                    );
                  }
                })}
              </Grid>
            </GridContainer>
          </div>
        );
      }}
    </Query>
  );
};

export default DatabaseGrid;
