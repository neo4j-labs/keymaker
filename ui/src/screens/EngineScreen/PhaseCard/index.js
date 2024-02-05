import React, { useState } from "react";
import PropTypes from "prop-types";
import { Mutation } from "@apollo/client/react/components";
import { graphql } from "@apollo/client/react/hoc";
import * as compose from "lodash.flowright";
import { Icon, Dropdown } from "semantic-ui-react";
import { CypherEditor } from '@neo4j-cypher/react-codemirror';

import Card from "./../../../components/Card";
import EditPhaseModal from "./../EditPhaseModal";
import Button from "./../../../components/Button";
import IconPopup from "../../../components/IconPopup";
import MessageModal from "../../../components/MessageModal";
import DeleteModal from "./../../../components/DeleteModal";

import "../../../App.css";
import "@neo4j-cypher/codemirror/css/cypher-codemirror.css";
import "@neo4j-cypher/codemirror/css/cypher-codemirror.css";


import {
  NoEdit,
  OuterWrapper,
  InnerWrapper,
  HeaderWrapper,
  Title,
  PhaseType,
  PhaseDescription,
  InvertedLabel,
  MaxAmountLabel,
} from "./style";

import { runMutation } from "../../../util/helper";
import { getCypherWorkbenchURL } from "../../../util/cypherWorkbenchHelper";

import { UPDATE_CW_PERMISSIONS } from "../../../graphql/dataModel";
import { DELETE_PHASE, EDIT_PHASE, GET_PHASES } from "../../../graphql/phase";
import { getDynamicConfigValue } from "../../../dynamicConfig";

var listenerAdded = false;

const phaseNameMap = {
  CypherDiscoveryPhase: "Cypher Discovery Phase",
  CypherBoostPhase: "Cypher Boost Phase",
  CypherExcludePhase: "Cypher Exclude Phase",
  CypherDiversityPhase: "Cypher Diversity Phase",
  CypherCollectionPhase: "Cypher Collection Phase",
  CypherWritePhase: "Cypher Write Phase",
  GDSCreatePhase: "GDS Create Phase",
  GDSWritePhase: "GDS Write Phase",
  GDSDropPhase: "GDS Drop Phase",
};

const PhaseCard = ({ phase, refresh, engine, ...mutations }) => {
  const { canCurrentUserEdit, canCurrentUserDelete } = engine;

  const [active, setActive] = useState(phase.active);
  const [isBeingEdited, setIsBeingEdited] = useState(false);
  const [showCypher, setShowCypher] = useState(phase.showCypher);
  const [isDeleteWarningOpen, setIsDeleteWarningOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);

  if (!listenerAdded) {
    window.addEventListener(
      "message",
      (event) => {
        const regexp = new RegExp(
          getDynamicConfigValue('REACT_APP_CYPHER_WORKBENCH_BASE_URL'),
          "i"
        );
        if (event.origin.match(regexp)) {
          if (event.data && event.data.length > 0) {
            if (event.data === "Updated") {
              refresh();
              window.focus();
            }
          }
        }
      },
      false
    );
    listenerAdded = true;
  }

  const getReturnValues = () => {
    switch (phase.__typename) {
      case "CypherDiscoveryPhase":
        return [{ alias: "item" }, { alias: "score" }, { alias: "details" }];
      case "CypherBoostPhase":
        return [{ alias: "item" }, { alias: "score" }, { alias: "details" }];
      case "CypherExcludePhase":
        return [{ alias: "item" }];
      case "CypherDiversityPhase":
        return [{ alias: "attribute" }];
      default:
        return [];
    }
  };

  // const updateCWPermissions = async (key, nodeLabel) => {
  //   await runMutation(mutations.UPDATE_CW_PERMISSIONS, {
  //     input: {
  //       key: key,
  //       nodeLabel: nodeLabel,
  //       userRoles: ["MEMBER"],
  //     },
  //   });
  // };

  let dropdownOptions = [
    {
      key: "edit phase",
      text: "edit phase",
      value: "edit phase",
      selected: false,
    },
    {
      key: active ? "set inactive" : "set active",
      text: active ? "set inactive" : "set active",
      value: active ? "set inactive" : "set active",
    },
    {
      key: showCypher ? "hide cypher" : "show cypher",
      text: showCypher ? "hide cypher" : "show cypher",
      value: showCypher ? "hide cypher" : "show cypher",
    },
    {
      key: "delete phase",
      text: "delete phase",
      value: "delete phase",
    },
  ];

  dropdownOptions =
    engine.dataModel &&
      engine.dataModel !== "None" &&
      phase.__typename !== "GDSDropPhase" &&
      phase.__typename !== "GDSWritePhase" &&
      phase.__typename !== "GDSWritePhase" &&
      phase.__typename !== "GDSCreatePhase" &&
      phase.__typename !== "CypherWritePhase" &&
      phase.__typename !== "CypherCollectionPhase"
      ? [
        {
          key: "edit visually",
          text: "edit visually",
          value: "edit visually",
          selected: false,
        },
        ...dropdownOptions,
      ]
      : dropdownOptions;

  const handleDropdownClick = async (value) => {
    if (value === "edit visually") {
      if (canCurrentUserEdit) {
        const properties = {
          dataModelKey: engine.dataModel,
          cypherBuilderKey: phase.cypherWorkbenchCypherBuilderKey,
          metadata: {
            title: phase.name,
            description: phase.description,
            notes: "Lauched from Keymaker...",
          },
          dbConnection: {
            name: engine.dbConnection.name,
            url: engine.dbConnection.url,
            username: "neo4j",
            encrypted: false,
            databaseName: "",
          },
          keymakerInfo: {
            engineId: engine.id,
            phaseId: phase.id,
            cypherQuery: "",
            keymakerOriginURL: new URL(window.location.href).origin,
            returnValues: getReturnValues(),
          },
        };
        // await updateCWPermissions(engine.dataModel, "DataModel");
        // if (phase.cypherWorkbenchCypherBuilderKey) {
        //   await updateCWPermissions(
        //     phase.cypherWorkbenchCypherBuilderKey,
        //     "CypherBuilder"
        //   );
        // }
        const url = getCypherWorkbenchURL(properties);
        window.open(url, "_blank");
      } else {
        setIsPermissionsModalOpen(true);
      }
    }
    if (value === "edit phase") {
      if (canCurrentUserEdit) {
        setIsBeingEdited(true);
      } else {
        setIsPermissionsModalOpen(true);
      }
    }
    if (value === "delete phase") {
      if (canCurrentUserDelete) {
        setIsDeleteWarningOpen(true);
      } else {
        setIsPermissionsModalOpen(true);
      }
    }
    if (value === "set active" || value === "set inactive") {
      if (canCurrentUserEdit) {
        setActive((oldValue) => !oldValue);
        runMutation(
          mutations.EDIT_PHASE,
          {
            id: phase.id,
            input: { active: !active },
          },
          [{ query: GET_PHASES, variables: { id: engine.id } }]
        );
      } else {
        setIsPermissionsModalOpen(true);
      }
    }
    if (value === "show cypher" || value === "hide cypher") {
      if (canCurrentUserEdit) {
        setShowCypher((oldValue) => !oldValue);
        runMutation(
          mutations.EDIT_PHASE,
          {
            id: phase.id,
            input: { showCypher: !showCypher },
          },
          [{ query: GET_PHASES, variables: { id: engine.id } }]
        );
      } else {
        setIsPermissionsModalOpen(true);
      }
    }
  };

  return (
    <OuterWrapper>
      <EditPhaseModal
        isOpen={isBeingEdited}
        onClose={() => setIsBeingEdited(false)}
        phase={phase}
        isEditing={true}
        refresh={refresh}
      />
      <MessageModal
        isOpen={isPermissionsModalOpen}
        onClose={() => setIsPermissionsModalOpen(false)}
        title={"Insufficient Permissions"}
        message={"You don't have permission to do that."}
      />
      <Mutation
        mutation={DELETE_PHASE}
        onCompleted={() => {
          setIsDeleteWarningOpen(false);
          refresh();
        }}
      >
        {(deletePhase) => (
          <DeleteModal
            isOpen={isDeleteWarningOpen}
            headerContent="Delete phase"
            content="Are you sure you want to delete this phase? This operation cannot be undone."
            onClose={() => setIsDeleteWarningOpen(false)}
            onDelete={() => deletePhase({ variables: { id: phase.id } })}
          />
        )}
      </Mutation>
      <Card width="700px">
        <InnerWrapper>
          <HeaderWrapper>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Title className="black text-med text-bold">{phase.name}</Title>
              <Icon
                style={{
                  marginBottom: "4px",
                  color: active ? "#63b344" : "#d84242",
                }}
                name={active ? "check circle" : "times circle"}
              ></Icon>
              <div style={{ width: "4px" }} />
              {phase.cypherWorkbenchCypherBuilderKey && (
                <div style={{ marginBottom: "0px" }}>
                  <IconPopup
                    iconName="wrench"
                    popupContent="Last edited in Cypher Workbench"
                  />
                </div>
              )}
            </div>
            <Dropdown
              icon={null}
              value={null}
              selectOnBlur={false}
              pointing="top left"
              trigger={
                <Button
                  narrow
                  darkenOnHover
                  className="hover text-thin text-small light-grey-background black margin-left-small"
                >
                  <Icon name="ellipsis horizontal"></Icon>
                </Button>
              }
              options={dropdownOptions}
              onChange={(e, { value }) => handleDropdownClick(value)}
            />
          </HeaderWrapper>
          <PhaseType className="blue">
            {phaseNameMap[phase.__typename]}
          </PhaseType>
          {phase.description !== "" && (
            <PhaseDescription className="text-thin text-small grey">
              {phase.description}
            </PhaseDescription>
          )}
          {showCypher ? (
            <NoEdit className="no-cursor">
              <CypherEditor value={phase.cypherQuery} />
            </NoEdit>
          ) : (
            <></>
          )}
          {phase.inverted === undefined ? null : phase.inverted ? (
            <InvertedLabel>Inverted</InvertedLabel>
          ) : (
            <InvertedLabel>Not Inverted</InvertedLabel>
          )}
          {phase.maxAmount === undefined ? null : (
            <MaxAmountLabel>Max amount: {phase.maxAmount}</MaxAmountLabel>
          )}
        </InnerWrapper>
      </Card>
    </OuterWrapper>
  );
};

PhaseCard.propTypes = {
  phase: PropTypes.shape({
    name: PropTypes.string.isRequired,
    __typename: PropTypes.string.isRequired,
    cypherQuery: PropTypes.string.isRequired,
    active: PropTypes.bool.isRequired,
    inverted: PropTypes.bool,
    maxAmount: PropTypes.number,
  }),
};

export default compose(
  graphql(EDIT_PHASE, {
    name: "EDIT_PHASE",
  }),
  graphql(UPDATE_CW_PERMISSIONS, {
    name: "UPDATE_CW_PERMISSIONS",
  })
)(PhaseCard);
