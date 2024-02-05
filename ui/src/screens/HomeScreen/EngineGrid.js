import React, { useState, useEffect } from "react";
import { Query } from "@apollo/client/react/components";
import styled from "styled-components";
import { Grid, Form } from "semantic-ui-react";

import EngineCard from "./EngineCard";
import CreateEngineModal from "./CreateEngineModal";
import NewEntityButton from "./../../components/NewEntityButton";

import { stringStartsWith } from "../../util/helper";

import { ALL_ENGINES_FOR_USER } from "../../graphql/engine";

const GridContainer = styled.div`
  margin-top: 15px;
  margin-bottom: 15px;
`;

const EngineGrid = () => {
  const prevFilter = localStorage.getItem("engineGridFilter")
  const [isAddingEngine, setIsAddingEngine] = useState(false);
  const [filter, setFilter] = useState(prevFilter !== "null" ? prevFilter : "");

  useEffect(() => {
  localStorage.setItem("engineGridFilter", filter)
  }, [filter])

  return (
    <Query query={ALL_ENGINES_FOR_USER}>
      {({ loading, error, data }) => {
        if (loading) return <p>Loading...</p>;
        if (error) return <p>Error</p>;
        const { engines } = data;
        return (
          <>
            <CreateEngineModal
              isOpen={isAddingEngine}
              onClose={() => setIsAddingEngine(false)}
            />
            <Grid columns="equal" stretched>
              <Grid.Column width={3}>
                <NewEntityButton
                  onClick={() => setIsAddingEngine(true)}
                  text="New Engine"
                />
              </Grid.Column>
              <Grid.Column>
                <Form.Input
                  fluid
                  placeholder="filter engines"
                  value={filter}
                  onChange={(e, data) => {
                    setFilter(data.value);
                  }}
                />
              </Grid.Column>
            </Grid>
            <GridContainer>
              <Grid columns="equal">
                {engines.map((engine, idx) => {
                  if (filter === "") {
                    return (
                      <Grid.Column
                        computer={4}
                        tablet={8}
                        mobile={16}
                        key={engine.id}
                      >
                        <EngineCard engine={engine} />
                      </Grid.Column>
                    );
                  } else {
                    const dbConnectionName = engine.dbConnection
                      ? engine.dbConnection.name
                      : null;
                    if (
                      stringStartsWith(filter, engine.name) ||
                      stringStartsWith(filter, dbConnectionName)
                    ) {
                      return (
                        <Grid.Column
                          computer={4}
                          tablet={8}
                          mobile={16}
                          key={engine.id}
                        >
                          <EngineCard engine={engine} />
                        </Grid.Column>
                      );
                    }
                  }
                })}
              </Grid>
            </GridContainer>
          </>
        );
      }}
    </Query>
  );
};

export default EngineGrid;
