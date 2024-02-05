import React, { useState } from "react";
import { Form } from "semantic-ui-react";
import FormModal from "../../components/FormModal";
import { graphql } from "@apollo/client/react/hoc";
import * as compose from "lodash.flowright";

import "../../App.css";

import { runMutation } from "../../util/helper";

import { GET_PHASES } from "../../graphql/phase";
import { IMPORT_ENGINE } from "../../graphql/engine";

const ImportModal = ({ isOpen, onClose, engineID, ...mutations }) => {
  const [json, setJson] = useState("");
  const [showJsonError, setShowJsonError] = useState(false);

  const resetModal = () => {};

  const handleSubmit = () => {
    let parsed;
    try {
      // parse the json string
      parsed = JSON.parse(json);
      // remove the __typename key/value
      delete parsed.__typename;
      parsed.phases.forEach((p) => {
        delete p.__typename;
      });
    } catch (err) {
      setShowJsonError(true);
      return;
    }

    // close modal and run import function
    onClose();
    runMutation(
      mutations.IMPORT_ENGINE,
      {
        id: engineID,
        engine: parsed,
      },
      [{ query: GET_PHASES, variables: { id: engineID } }]
    );
  };

  return (
    <FormModal
      size={"small"}
      isOpen={isOpen}
      buttonName={"Submit"}
      onClose={() => {
        onClose();
        resetModal();
      }}
      onSubmit={handleSubmit}
    >
      <Form error>
        <Form.TextArea
          label="Paste JSON"
          onChange={(_, data) => setJson(data.value)}
          error={
            showJsonError
              ? {
                  content: "invalid JSON",
                  pointing: "above",
                }
              : false
          }
        />
        <div className="grey text-thin">
          Note: Importing an engine will overwrite any existing phases.
        </div>
      </Form>
    </FormModal>
  );
};

export default compose(
  graphql(IMPORT_ENGINE, {
    name: "IMPORT_ENGINE",
  })
)(ImportModal);
