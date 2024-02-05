import { withApollo } from "@apollo/client/react/hoc";
import FormModal from "../../components/FormModal";
import React, { useState, useEffect } from "react";
import { Form, Dimmer, Loader } from "semantic-ui-react";

import { checkInputs, isPositiveInteger } from "../../util/helper";

import {
  RUN_BATCH_ENGINE,
  CANCEL_BATCH_ENGINE,
  IS_BATCH_ENGINE_RUNNING,
} from "../../graphql/engine";
const JobSchedulerModal = ({ isOpen, onClose, engineID, ...props }) => {
  const [loading, setLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [params, setParams] = useState("");
  const [delaySeconds, setDelaySeconds] = useState(0);
  const [timeIntervalSeconds, setTimeIntervalSeconds] = useState("");

  const [showDelayError, setShowDelayError] = useState(false);
  const [showTimeIntervalError, setShowTimeIntervalError] = useState(false);

  useEffect(() => {
    const asyncWrapper = async () => {
      setLoading(true);
      const isRunning = await isJobRunning(engineID);
      isRunning
        ? setIsRunning(isRunning.data.isBatchEngineRunning)
        : setIsRunning(false);
      setLoading(false);
    };
    asyncWrapper();
  }, [isOpen, engineID]);

  const resetModal = () => {
    setParams("");
    setDelaySeconds(0);
    setTimeIntervalSeconds("");
    setShowDelayError(false);
    setShowTimeIntervalError(false);
  };

  const startJob = async (
    engineID,
    params,
    delaySeconds,
    timeIntervalSeconds
  ) => {
    const res = await props.client
      .query({
        query: RUN_BATCH_ENGINE,
        variables: { engineID, params, delaySeconds, timeIntervalSeconds },
      })
      .catch((err) => {
        console.log(err);
      });
    return res;
  };

  const cancelJob = async (engineID) => {
    const res = await props.client
      .query({
        query: CANCEL_BATCH_ENGINE,
        variables: { engineID },
      })
      .catch((err) => {
        console.log(err);
      });
    return res;
  };

  const isJobRunning = async (engineID) => {
    const res = await props.client
      .query({
        query: IS_BATCH_ENGINE_RUNNING,
        variables: { engineID },
      })
      .catch((err) => {
        console.log(err);
      });
    return res;
  };

  const handleStartJob = () => {
    if (
      checkInputs([
        {
          input: delaySeconds,
          functions: [isPositiveInteger],
          onError: () => {
            setShowDelayError(true);
          },
        },
        {
          input: timeIntervalSeconds,
          functions: [isPositiveInteger],
          onError: () => {
            setShowTimeIntervalError(true);
          },
        },
      ])
    ) {
      startJob(engineID, params, delaySeconds, timeIntervalSeconds);
      onClose();
      resetModal();
    }
  };

  const handleCancelJob = () => {
    cancelJob(engineID);
    onClose();
    resetModal();
  };

  return (
    <FormModal
      size={"small"}
      isOpen={isOpen}
      buttonName={isRunning ? "Stop" : "Submit"}
      onSubmit={() => (isRunning ? handleCancelJob() : handleStartJob())}
      onClose={() => {
        onClose();
        resetModal();
      }}
    >
      {loading && (
        <div style={{ height: "150px" }}>
          <Dimmer active inverted>
            <Loader>Loading</Loader>
          </Dimmer>
        </div>
      )}
      {!loading && isRunning && (
        <div className="text-med grey text-thin">
          This engine is already running. Would you like to stop it?
        </div>
      )}
      {!loading && !isRunning && (
        <Form error>
          <Form.Input
            label="Params (optional)"
            placeholder="key1: value1, key2: value2"
            value={params}
            onChange={(_, data) => setParams(data.value)}
          />
          <Form.Input
            type="number"
            label="Delay (seconds)"
            placeholder="start this job in x seconds"
            value={delaySeconds}
            onChange={(_, data) => {
              setShowDelayError(false);
              const value = parseInt(data.value, 10);
              value || value === 0
                ? setDelaySeconds(value)
                : setDelaySeconds("");
            }}
            error={
              showDelayError
                ? {
                    content: "delay must be a valid integer",
                    pointing: "above",
                  }
                : false
            }
          />
          <Form.Input
            type="number"
            label="Time Interval (seconds)"
            placeholder="run this engine every x seconds"
            value={timeIntervalSeconds}
            onChange={(_, data) => {
              setShowTimeIntervalError(false);
              const value = parseInt(data.value, 10);
              value || value === 0
                ? setTimeIntervalSeconds(value)
                : setTimeIntervalSeconds("");
            }}
            error={
              showTimeIntervalError
                ? {
                    content: "time interval must be a valid integer",
                    pointing: "above",
                  }
                : false
            }
          />
          <div className="grey text-thin">
            Note: Remember to provide any params your engine expects to use.
          </div>
        </Form>
      )}
    </FormModal>
  );
};

export default withApollo(JobSchedulerModal);
