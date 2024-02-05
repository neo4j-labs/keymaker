import React from "react";
import { Route } from "react-router-dom";
import auth from "./auth";
import { isAuthenticated as isAuth } from "./auth2";
import { getDynamicConfigValue } from "../dynamicConfig";

const PrivateRoute = ({ path, component: Component, ...rest }) => (
  <Route
    exact
    path={path}
    render={(props) => {
      if (getDynamicConfigValue('REACT_APP_AUTH_METHOD') === "auth0") {
        if (auth.isAuthenticated()) {
          return <Component {...props} {...rest} />;
        }
        return null;
      } else {
        if (isAuth()) {
          return <Component {...props} {...rest} />;
        } else if (
          props.location.pathname === "/your-email" ||
          props.location.pathname.match("/eula/*")
        ) {
          return <></>;
        } else {
          return <></>;
        }
      }
    }}
  />
);

export default PrivateRoute;
