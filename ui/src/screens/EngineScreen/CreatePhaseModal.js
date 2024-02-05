import React, { useState } from "react";
import { graphql } from "@apollo/client/react/hoc";
import { Form, Message } from "semantic-ui-react";
import * as compose from "lodash.flowright";
import FormModal from "../../components/FormModal";
import { CypherEditor } from '@neo4j-cypher/react-codemirror';
import "@neo4j-cypher/codemirror/css/cypher-codemirror.css";

import "./cypherEditor.css";

import { CREATE_PHASE } from "../../graphql/phase";
import {
  checkInputs,
  runMutation,
  isPositiveInteger,
  notNullUndefinedOrEmpty,
} from "../../util/helper";
import IconPopup from "../../components/IconPopup";

const phaseTypeOptions = [
  {
    text: "Cypher Discovery Phase",
    value: "CypherDiscoveryPhase",
    key: "CypherDiscoveryPhase",
  },
  {
    text: "Cypher Boost Phase",
    value: "CypherBoostPhase",
    key: "CypherBoostPhase",
  },
  {
    text: "Cypher Exclude Phase",
    value: "CypherExcludePhase",
    key: "CypherExcludePhase",
  },
  {
    text: "Cypher Diversity Phase",
    value: "CypherDiversityPhase",
    key: "CypherDiversityPhase",
  },
  {
    text: "Cypher Collection Phase",
    value: "CypherCollectionPhase",
    key: "CypherCollectionPhase",
  },
  {
    text: "Cypher Write Phase",
    value: "CypherWritePhase",
    key: "CypherWritePhase",
  },
  {
    text: "GDS Create Phase",
    value: "GDSCreatePhase",
    key: "GDSCreatePhase",
  },
  {
    text: "GDS Write Phase",
    value: "GDSWritePhase",
    key: "GDSWritePhase",
  },
  {
    text: "GDS Drop Phase",
    value: "GDSDropPhase",
    key: "GDSDropPhase",
  },
];

const CreatePhaseModal = ({
  isOpen,
  onClose,
  refresh,
  engineID,
  prevPhaseID,
  ...mutations
}) => {
  const [name, setName] = useState("");
  const [maxAmount, setMaxAmount] = useState(3);
  const [phaseType, setPhaseType] = useState("");
  const [inverted, setInverted] = useState(false);
  const [description, setDescription] = useState("");
  const [cypherQuery, setCypherQuery] = useState("\n\n");
  const [canSetCypherContent, setCanSetCypherContent] = useState(true);

  const [showNameError, setShowNameError] = useState(false);
  const [showMaxAmountError, setShowMaxAmountError] = useState(false);
  const [showPhaseTypeError, setShowPhaseTypeError] = useState(false);

  const [showError, setShowError] = React.useState(false);
  const [errorText, setErrorText] = React.useState("");

  const resetModal = () => {
    setName("");
    setMaxAmount(1);
    setPhaseType("");
    setInverted(false);
    setDescription("");
    setCypherQuery("\n\n");
    setCanSetCypherContent(true);
  };

  const resetErrors = () => {
    setShowNameError(false);
    setShowPhaseTypeError(false);
    setShowMaxAmountError(false);
  };

  const onMutationSuccess = () => {
    onClose();
    refresh();
    resetModal();
    resetErrors();
  };

  const onMutationError = (error) => {
    if (
      error.graphQLErrors[0].message ===
      "Keymaker license expired"
    ) {
      setShowError(true);
      setErrorText(
        "Your Keymaker license has expired"
      );
    }
  };

  const updateCache = (store, data) => { };

  const setCypherHelperContent = async (phaseType) => {
    if (canSetCypherContent) {
      if (phaseType === "CypherDiscoveryPhase") {
        setCypherQuery(
          "/* Discovery phases match on potential recommendations */\n\n" +
          "// Your code goes here...\n\n" +
          "RETURN _ AS item, _ AS score , {} AS details"
        );
      } else if (phaseType === "CypherBoostPhase") {
        setCypherQuery(
          "/* Boost phases alter the score of items in your recommendations list */\n\n" +
          "// Your code goes here...\n\n" +
          "RETURN this as item , _ AS score , {} AS details"
        );
      } else if (phaseType === "CypherExcludePhase") {
        setCypherQuery(
          "/* Exclude phases remove items from your recommendations list */\n\n" +
          "// Your code goes here...\n\n" +
          "RETURN _ AS item"
        );
      } else if (phaseType === "CypherDiversityPhase") {
        setCypherQuery(
          "/* Diversity phases limit the number of certain items in your recommendations list */\n\n" +
          "// Your code goes here...\n\n" +
          "RETURN _ AS attribute"
        );
      } else if (phaseType === "CypherCollectionPhase") {
        setCypherQuery(
          "/* Collection phases run before your pipeline is excecuted and allow you to access the values you return using the $ notation later in your pipeline */\n\n" +
          "// Note: If you use the same key twice only the most recent value will be kept.\n\n" +
          "// Your code goes here...\n\n" +
          "RETURN {} AS map"
        );
      } else if (phaseType === "CypherWritePhase") {
        setCypherQuery(
          "/* Use a cypher write phase to write back to neo4j */\n\n" +
          "// NOTE: A write phase that performs a MATCH clause which returns 0 rows will prematurely break the pipeline. This can be handled with something like apoc.do.when().\n\n" +
          "// Your code goes here...\n"
        );
      } else if (phaseType === "GDSCreatePhase") {
        setCypherQuery(
          "/* Use a GDS create phase to create an in-memory graph */\n\n" +
          "// Your code goes here...\n\n" +
          "YIELD graphName"
        );
      } else if (phaseType === "GDSWritePhase") {
        setCypherQuery(
          "/* Use a GDS write phase to mutate your in-memory graph or write back to neo4j */\n\n" +
          "// NOTE: A write phase that performs a MATCH clause which returns 0 rows will prematurely break the pipeline. This can be handled with something like apoc.do.when().\n\n" +
          "// Your code goes here...\n\n" +
          "YIELD _"
        );
      } else if (phaseType === "GDSDropPhase") {
        setCypherQuery(
          "/* Use a GDS drop phase to remove an in-memory graph */\n\n" +
          "// Your code goes here...\n\n" +
          "YIELD graphName"
        );
      }
    }
  };

  const handleSubmit = () => {
    if (
      checkInputs([
        {
          input: phaseType,
          functions: [notNullUndefinedOrEmpty],
          onError: () => {
            setShowPhaseTypeError(true);
          },
        },
        {
          input: name,
          functions: [notNullUndefinedOrEmpty],
          onError: () => {
            setShowNameError(true);
          },
        },
        {
          input: maxAmount,
          functions: [notNullUndefinedOrEmpty, isPositiveInteger],
          onError: () => {
            setShowMaxAmountError(true);
          },
        },
      ])
    ) {
      const variables = {
        engineID,
        phaseType,
        prevPhaseID,
        input: {
          name,
          active: true,
          showCypher: true,
          inverted,
          maxAmount,
          description,
          cypherQuery,
        },
      };
      runMutation(
        mutations.CREATE_PHASE,
        variables,
        [],
        onMutationError,
        onMutationSuccess,
        updateCache
      );
    }
  };

  return (
    <FormModal
      size={"small"}
      isOpen={isOpen}
      buttonName={"Submit"}
      onClose={() => {
        onClose();
        resetModal();
        resetErrors();
      }}
      onSubmit={handleSubmit}
    >
      <Form>
        <Form.Input
          label="Phase Name"
          value={name}
          error={showNameError}
          onChange={(e, data) => {
            setName(data.value);
            setShowNameError(false);
          }}
        />
        <Form.TextArea
          label="Phase Description"
          value={description}
          onChange={(e, data) => setDescription(data.value)}
        />
        <Form.Select
          label="Phase Type"
          value={phaseType}
          selectOnBlur={false}
          error={showPhaseTypeError}
          options={phaseTypeOptions}
          onChange={(e, data) => {
            setPhaseType(data.value);
            setShowPhaseTypeError(false);
            setCypherHelperContent(data.value);
          }}
        />
        <Form.Field>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <label>Cypher Query</label>
            <div style={{ width: "8px" }} />
            <div className="blue">
              <IconPopup
                iconName="info circle"
                popupContent="Note: You may edit your cypher query using Cypher Workbench by
              selecting the 'edit visually' option in the phase card menu. Make
              sure any collaborators have the appropriate permissions in Cypher
              Workbench"
              />
            </div>
          </div>
          <CypherEditor
            value={cypherQuery}
            onValueChanged={(value) => {
              setCypherQuery(value);
              setCanSetCypherContent(false);
            }}
          />
        </Form.Field>
        {phaseType && phaseType === "CypherExcludePhase" ? (
          <Form.Checkbox
            label="Inverted"
            checked={inverted}
            onChange={(e, { checked }) => {
              setInverted(checked);
            }}
          />
        ) : null}
        {phaseType && phaseType === "CypherDiversityPhase" ? (
          <Form.Input
            type="number"
            value={maxAmount}
            label="Max Amount"
            error={showMaxAmountError}
            onChange={(e, data) => {
              setShowMaxAmountError(false);
              const value = parseInt(data.value, 10);
              value ? setMaxAmount(value) : setMaxAmount("");
            }}
          />
        ) : null}
      </Form>
      {showError ? (
        <Message
          size="large"
          floating
          onDismiss={() => {
            setShowError(false);
            setErrorText("");
          }}
          error
          header={errorText}
        />
      ) : null}
    </FormModal>
  );
};

export default compose(
  graphql(CREATE_PHASE, {
    name: "CREATE_PHASE",
  })
)(CreatePhaseModal);
