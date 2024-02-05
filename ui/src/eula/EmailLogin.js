import React, { useState } from "react";
import { acceptedEula as a, setSession, loginEnterprise } from "../auth/auth2";
import history from "../auth/history";

import { Button, Input } from "semantic-ui-react";

import Wrapper from "./Wrapper";

const EmailLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const validateEmail = (email) => {
    var re = /\S+@\S+\.\S+/;
    return re.test(email);
  };

  const handleContinue = async () => {
    if (email && validateEmail(email)) {
      const loginStatus = await loginEnterprise(email, password);
      if (loginStatus === "true") {
        const acceptedEula = await a(email);
        if (acceptedEula === "true") {
          setSession(email, true);
          history.replace("/");
        } else if (acceptedEula === "false") {
          history.replace("/eula/" + email);
        }
      } else {
        setSnackbarOpen(true);
        setSnackbarMessage("Oops! Please enter the right credentials");
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
        Enter login info
      </div>
      <div />
      <div style={{ height: "36px" }} />
      <Input
        placeholder="email"
        style={{ width: "350px", fontFamily: "lato", fontWeight: "400" }}
        onChange={(e) => setEmail(e.target.value)}
      />
      <div style={{ height: "24px" }} />
      <Input
        placeholder="password"
        type="password"
        style={{ width: "350px", fontFamily: "lato", fontWeight: "400" }}
        onChange={(e) => setPassword(e.target.value)}
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

export default EmailLogin;
