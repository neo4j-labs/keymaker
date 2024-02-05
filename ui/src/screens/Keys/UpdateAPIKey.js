import { graphql } from "@apollo/client/react/hoc";
import React, { useState } from "react";
import * as compose from "lodash.flowright";
import Button from "../../components/Button";
import { Message, Form } from "semantic-ui-react";
import MessageModal from "../../components/MessageModal";

import { runMutation } from "../../util/helper";
import { UPDATE_API_KEY } from "../../graphql/keys";

const UpdateAPIKey = ({ ...mutations }) => {
  const [apiKey, setAPIKey] = useState("");
  const [duration, setDuration] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const onMutationError = (e) => {
    setSnackbarOpen(true);
    setSnackbarMessage(e + "");
  };

  const onMutationSuccess = (result) => {
    setModalOpen(true);
    setModalMessage(
      "You API key expiration date has been updated to " +
        result.data.apiKey.expirationDate.year +
        "-" +
        result.data.apiKey.expirationDate.month +
        "-" +
        result.data.apiKey.expirationDate.day
    );
  };

  const updateAPIKey = async () => {
    // if no API key was entered throw an error
    if (!apiKey) {
      setSnackbarOpen(true);
      setSnackbarMessage("Please enter an API key to update.");
      return;
    }
    // if no duration was entered throw an error
    if (!duration) {
      setSnackbarOpen(true);
      setSnackbarMessage(
        "Please enter a duration to update the expiration date of your key."
      );
      return;
    }
    // if an invalid duration was entered throw an error
    if (!parseInt(duration)) {
      setSnackbarOpen(true);
      setSnackbarMessage("Duration must be an number.");
      return;
    }
    await runMutation(
      mutations.UPDATE_API_KEY,
      { key: apiKey, duration: parseInt(duration) },
      [],
      onMutationError,
      onMutationSuccess,
      undefined
    );
    // reset form
    setAPIKey("");
    setDuration("");
  };

  return (
    <>
      <MessageModal
        message={modalMessage}
        isOpen={modalOpen}
        title="Success!"
        onClose={() => setModalOpen(false)}
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
          <label>Key</label>
          <Form.Input
            value={apiKey}
            placeholder="Your api key"
            onChange={(e) => setAPIKey(e.target.value)}
          />
        </Form.Field>
        <Form.Field>
          <label>Duration</label>
          <Form.Input
            value={duration}
            placeholder="Number of days your API key will remain valid"
            onChange={(e) => setDuration(e.target.value)}
          />
        </Form.Field>
        <Button
          onClick={async () => await updateAPIKey()}
          className="blue-background white text-small text-normal"
        >
          Update API Key
        </Button>
      </Form>
    </>
  );
};

export default compose(
  graphql(UPDATE_API_KEY, {
    name: "UPDATE_API_KEY",
  })
)(UpdateAPIKey);
