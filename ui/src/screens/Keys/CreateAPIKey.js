import { graphql } from "@apollo/client/react/hoc";
import React, { useState } from "react";
import * as compose from "lodash.flowright";
import Button from "../../components/Button";
import { Message, Form } from "semantic-ui-react";
import MessageModal from "../../components/MessageModal";

import { runMutation } from "../../util/helper";
import { CREATE_API_KEY } from "../../graphql/keys";

const CreateAPIKey = ({ ...mutations }) => {
  const [apiKey, setAPIKey] = useState("");
  const [duration, setDuration] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const onMutationError = (e) => {
    setSnackbarOpen(true);
    setSnackbarMessage(e + "");
  };

  const onMutationSuccess = (result) => {
    setModalOpen(true);
    setAPIKey(result.data.apiKey.key);
  };

  const createAPIKey = () => {
    // attempt to cast the duration from string to int
    const parsedDuration = parseInt(duration);
    if (duration && (!parsedDuration || parsedDuration < 1)) {
      // if an invalid duration was entered throw an error
      setSnackbarOpen(true);
      setSnackbarMessage("Duration must be a positive integer.");
      return;
    }
    runMutation(
      mutations.CREATE_API_KEY,
      { duration: parsedDuration },
      [],
      onMutationError,
      onMutationSuccess,
      undefined
    );
  };

  return (
    <>
      <MessageModal
        message={apiKey}
        isOpen={modalOpen}
        title="Copy and Store Securely"
        onClose={() => {
          setAPIKey();
          setModalOpen(false);
        }}
      />
      {snackbarOpen ? (
        <Message
          error
          header={snackbarMessage}
          onDismiss={() => setSnackbarOpen(false)}
        />
      ) : (
        <></>
      )}
      <Form>
        <Form.Field>
          <label>Duration (Optional)</label>
          <input
            placeholder="Number of days your API key will remain valid"
            onChange={(e) => setDuration(e.target.value)}
          />
        </Form.Field>
        <Button
          onClick={createAPIKey}
          className="blue-background white text-small text-normal"
        >
          Generate API Key
        </Button>
      </Form>
    </>
  );
};

export default compose(
  graphql(CREATE_API_KEY, {
    name: "CREATE_API_KEY",
  })
)(CreateAPIKey);
