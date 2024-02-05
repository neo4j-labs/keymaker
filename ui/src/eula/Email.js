import React, { useState } from "react";
import { acceptedEula as a, setSession } from "../auth/auth2";
import history from "../auth/history";

import { Button, Input } from "semantic-ui-react";

import Wrapper from "./Wrapper";

const Email = () => {
  const [email, setEmail] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const validateEmail = (email) => {
    var re = /\S+@\S+\.\S+/;
    return re.test(email);
  };

  const handleContinue = async () => {
    if (email && validateEmail(email)) {
      const acceptedEula = await (email);
      if (acceptedEula === "true") {
        setSession(email, true);
        history.replace("/");
      } else if (acceptedEula === "false") {
        history.replace("/eula/" + email);
      } else {
        setSnackbarOpen(true);
        setSnackbarMessage(
          "Oops! Please enter the email you logged in with initially"
        );
      }
    } else {
      setSnackbarOpen(true);
      setSnackbarMessage("Oops! that's not a valid email");
    }
  };

  return (
    <Wrapper
      snackbarOpen={snackbarOpen}
      setSnackbarOpen={setSnackbarOpen}
      snackbarMessage={snackbarMessage}
    >
      <div
        style={{
          width: "350px",
          color: "#37474f",
          fontSize: "24px",
          fontFamily: "lato",
          fontWeight: "500",
        }}
      >
        What's your email?
      </div>
      <div />
      <div style={{ height: "36px" }} />
      <Input
        label="email"
        style={{ width: "350px", fontFamily: "lato", fontWeight: "400" }}
        onChange={(e) => setEmail(e.target.value)}
      />
      <div style={{ height: "24px" }} />
      <Button
        primary
        onClick={() => handleContinue()}
        style={{
          height: "50px",
          width: "350px",
          fontFamily: "lato",
          fontWeight: "700",
        }}
      >
        Continue
      </Button>
    </Wrapper>
  );
};

export default Email;
