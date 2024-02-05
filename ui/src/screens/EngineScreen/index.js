import React from "react";
import { Query } from "@apollo/client/react/components";
import styled from "styled-components";
import { Icon } from "semantic-ui-react";

import PhaseCard from "./PhaseCard";
import EngineHeader from "./EngineHeader";
import CreatePhaseModal from "./CreatePhaseModal";
import IconPopup from "./../../components/IconPopup";
import MessageModal from "../../components/MessageModal";
import ContentWrapper from "./../../components/ContentWrapper";
import NewEntityButton from "../../components/NewEntityButton";

import "../../App.css";

import { GET_PHASES } from "../../graphql/phase";

const PhaseCardsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 45px;
  margin-bottom: 45px;
`;

const ArrowWrapper = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 20px;
  justify-content: center;
  align-items: center;
  color: white;
  text-shadow: 0 4px 8px rgba(50, 50, 93, 0.1);

  i.plus {
    margin-top: 10px;
    color: white;
    &:hover {
      cursor: pointer;
      color: #63b344;
      color: #ced5e385;
    }
  }
`;

export default class EngineScreen extends React.Component {
  state = {
    isAddingPhase: false,
    prevPhaseID: null,
  };

  closeNewPhaseModal = () =>
    this.setState({ isAddingPhase: false, prevPhaseID: null });
  openNewPhaseModal = (prevPhaseID) =>
    this.setState({ isAddingPhase: true, prevPhaseID });

  openPermissionsModal = () => this.setState({ isPermissionsModalOpen: true });
  closePermissionsModal = () =>
    this.setState({ isPermissionsModalOpen: false });

  render() {
    const engineID = this.props.match.params.id;
    const { isAddingPhase, prevPhaseID } = this.state;
    return (
      <ContentWrapper>
        <MessageModal
          isOpen={this.state.isPermissionsModalOpen}
          onClose={() => {
            this.closePermissionsModal();
          }}
          title={"Insufficient Permissions"}
          message={"You don't have permission to do that."}
        />
        <Query query={GET_PHASES} variables={{ id: engineID }}>
          {({ loading, error, data, refetch }) => {
            if (loading) return <></>;
            if (error) return <div>{`Error: ${error}`}</div>;
            const { phases } = data.engine;
            return (
              <>
                <EngineHeader engine={data.engine} />
                <React.Fragment>
                  <PhaseCardsWrapper>
                    <div style={{ display: "flex", flexDirection: "row" }}>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        {phases.map((phase, i) => (
                          <div key={phase.id}>
                            <PhaseCard
                              phase={phase}
                              refresh={refetch}
                              engine={data.engine}
                            />
                            <ArrowWrapper>
                              <Icon
                                name="long arrow alternate down"
                                size="huge"
                              />
                              {i === phases.length - 1 ? null : (
                                <IconPopup
                                  iconName="plus circle"
                                  iconSize="big"
                                  popupContent="New Phase"
                                  onClick={() => {
                                    if (data.engine.canCurrentUserEdit) {
                                      this.openNewPhaseModal(phase.id);
                                    } else {
                                      this.openPermissionsModal();
                                    }
                                  }}
                                />
                              )}
                            </ArrowWrapper>
                          </div>
                        ))}
                      </div>
                      {/*
                      <div style={{marginLeft: '30px'}}>
                        <iframe src="http://localhost:3000/tools/cypherbuilder" 
                                height='1000px' width='1150px'
                                title="Cypher Workbench"></iframe>
                      </div>
                      */}
                    </div>
                    <CreatePhaseModal
                      isOpen={isAddingPhase}
                      prevPhaseID={prevPhaseID}
                      engineID={engineID}
                      onClose={this.closeNewPhaseModal}
                      isEditing={false}
                      refresh={refetch}
                    />
                    <NewEntityButton
                      text="New Phase"
                      onClick={() => {
                        if (data.engine.canCurrentUserEdit) {
                          const prevPhaseID =
                            phases.length === 0
                              ? null
                              : phases[phases.length - 1].id;
                          this.openNewPhaseModal(prevPhaseID);
                        } else {
                          this.openPermissionsModal();
                        }
                      }}
                    />
                  </PhaseCardsWrapper>
                </React.Fragment>
              </>
            );
          }}
        </Query>
      </ContentWrapper>
    );
  }
}
