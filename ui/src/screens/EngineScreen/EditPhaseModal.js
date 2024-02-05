import React, { useState } from "react";
import { graphql } from "@apollo/client/react/hoc";
import { Form, Message } from "semantic-ui-react";
import * as compose from "lodash.flowright";
import FormModal from "../../components/FormModal";
import { CypherEditor } from '@neo4j-cypher/react-codemirror';

import "./cypherEditor.css";
import "@neo4j-cypher/codemirror/css/cypher-codemirror.css";

import { EDIT_PHASE } from "../../graphql/phase";
import {
  checkInputs,
  runMutation,
  notNullUndefinedOrEmpty,
} from "../../util/helper";

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
  phase,
  isOpen,
  onClose,
  refresh,
  engineID,
  prevPhaseID,
  ...mutations
}) => {
  const [name, setName] = useState(phase.name);
  const [maxAmount, setMaxAmount] = useState(phase.maxAmount);
  const [phaseType, setPhaseType] = useState(phase.phaseType);
  const [inverted, setInverted] = useState(phase.inverted);
  const [description, setDescription] = useState(phase.description);
  const [cypherQuery, setCypherQuery] = useState(phase.cypherQuery);

  const [showNameError, setShowNameError] = useState(false);
  const [showMaxAmountError, setShowMaxAmountError] = useState(false);
  const [showPhaseTypeError, setShowPhaseTypeError] = useState(false);

  const [showError, setShowError] = React.useState(false);
  const [errorText, setErrorText] = React.useState("");

  const resetModal = () => {
    setName(phase.name);
    setMaxAmount(phase.maxAmount);
    setPhaseType(phase.phaseType);
    setInverted(phase.inverted);
    setDescription(phase.description);
    setCypherQuery(phase.cypherQuery);
  };

  const resetErrors = () => {
    setShowNameError(false);
    setShowPhaseTypeError(false);
    setShowMaxAmountError(false);
  };

  const onMutationSuccess = () => {
    onClose();
    refresh();
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
      ])
    ) {
      const variables = {
        id: phase.id,
        input: {
          name,
          description,
          cypherQuery,
          cypherWorkbenchCypherBuilderKey: null,
        },
      };
      if (phaseType === "CypherExcludePhase") {
        variables.input.inverted = inverted;
      } else if (phaseType === "CypherDiversityPhase") {
        variables.input.maxAmount = maxAmount;
      }
      runMutation(
        mutations.EDIT_PHASE,
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
          options={phaseTypeOptions.filter(
            (option) => option.key === phaseType
          )}
        />
        <Form.Field>
          <label>Cypher Query</label>
          <CypherEditor
            value={cypherQuery}
            onValueChanged={(value) => setCypherQuery(value)}
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
  graphql(EDIT_PHASE, {
    name: "EDIT_PHASE",
  })
)(CreatePhaseModal);
