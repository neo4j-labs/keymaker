import React, { useState } from "react";
import { Form } from "semantic-ui-react";
import styled from "styled-components";
import { login } from "../../auth/auth2";
import auth from "../../auth/auth";
import { getDynamicConfigValue } from "../../dynamicConfig";

const Container = styled.div`
  display: flex;
  justify-content: center;
  padding-top: 120px;
`;

const LoginCard = styled.div`
  width: 600px;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23);
  border-radius: 5px;
  padding: 25px;
`;

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const handleEmailChange = (e, { value }) => setEmail(value);
  const handlePasswordChange = (e, { value }) => setPassword(value);
  const handleSubmit = () => {
    login(email, password);
  };
  if (getDynamicConfigValue('REACT_APP_AUTH_METHOD') === "auth0") {
    return auth.login();
  } else {
    return (
      <Container>
        <LoginCard>
          <h2>Login</h2>
          <Form onSubmit={handleSubmit}>
            <Form.Input
              label="Email or User Id"
              value={email}
              onChange={handleEmailChange}
            />
            <Form.Input
              label="Password"
              type="password"
              value={password}
              onChange={handlePasswordChange}
            />
            <Form.Button color="blue" onClick={handleSubmit}>
              Login
            </Form.Button>
          </Form>
        </LoginCard>
      </Container>
    );
  }
};
export default Login;
