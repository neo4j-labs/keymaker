import React, { Component } from "react";
import { Route, withRouter } from "react-router-dom";
import Callback from "./auth/Callback";
import styled from "styled-components";
import Navbar from "./components/Navbar";
import HomeScreen from "./screens/HomeScreen";
import PrivateRoute from "./auth/PrivateRoute";
import EngineScreen from "./screens/EngineScreen";
import PermissionsScreen from "./screens/PermissionsScreen";
import auth from "./auth/auth";
import Eula from "./eula/Eula";
import Email from "./eula/Email";
import Keys from "./screens/Keys";
import EmailLogin from "./eula/EmailLogin";
import packageInfo from "./../package.json";
import {
  callLogEulaAcceptance,
  acceptedEula,
  checkLicense,
  setSession,
  logout,
} from "./auth/auth2";
import { getDynamicConfigValue } from "./dynamicConfig";
import { AppName } from "./constants";
import { fetchBrandingInfo } from "./graphql/getBrandingInfo";

const VersionNumber = styled.div`
  color: white;
  text-align: center;
  margin-bottom: 25px;
`;
const auth0Enabled = getDynamicConfigValue("REACT_APP_AUTH_METHOD") === "auth0";

class App extends Component {

  brandingInfo = JSON.parse(localStorage.getItem('brandingInfo') || '{}');

  state = {
    brandingInfo: this.brandingInfo
  }

  async getBrandingInfo() {
    var brandingInfo = JSON.parse(localStorage.getItem('brandingInfo') || '{}');
    if (localStorage.getItem("id_token")) {
      brandingInfo = await fetchBrandingInfo();
      localStorage.setItem('brandingInfo', JSON.stringify(brandingInfo));
    }
    this.setState({
      brandingInfo: brandingInfo
    })
  }

  async componentDidMount() {
    if (auth0Enabled) {
      if (this.props.location.pathname === "/callback") {
        return;
      }
      try {
        await auth.silentAuth();
        await checkLicense(auth.getIdToken());
        //alert("getDynamicConfigValue('REACT_APP_RUN_MODE'): " + getDynamicConfigValue('REACT_APP_RUN_MODE'));
        if (getDynamicConfigValue('REACT_APP_RUN_MODE') === 'partner') {
          //alert("Calling getBrandingInfo")
          await this.getBrandingInfo();
        }
        this.forceUpdate();
      } catch (err) {
        if (err.message === "login_required" || err.error === "login_required") auth.login();
        //alert("Unhandled error: "  + JSON.stringify(err));
        return;
      }
    } else {
      const email = localStorage.getItem("id_token");
      await checkLicense();
      if (email && (await acceptedEula(email))) {
        // if email exists and has accepted the Eula set the session
        callLogEulaAcceptance(email);
        setSession(email, true);
        this.forceUpdate();
      } else if (
        this.props.location.pathname !== "/your-email" &&
        this.props.location.pathname !== "/login" &&
        !this.props.location.pathname.match("/eula/*")
      ) {
        // if no email exists or user has not accepted the Eula logout
        logout();
      }
    }
  }

  render() {
    const { brandingInfo } = this.state;
    return (
      <div style={{ minHeight: 'calc(100vh - 130px)' }}>
        <Route exact path="/callback" component={Callback} />
        {!auth0Enabled && (
          <>
            <Route exact path="/login" component={EmailLogin} />
            <Route exact path="/eula/:email" component={Eula} />
            <Route exact path="/your-email" component={Email} />
          </>
        )}
        <PrivateRoute
          path={[
            "/",
            "/keys",
            "/engine/:id",
            "/engine/:id/collaborators",
            "/db/:id/collaborators",
          ]}
          component={Navbar}
          brandingInfo={brandingInfo}
        />
        <PrivateRoute path={"/"} component={HomeScreen} />
        <PrivateRoute path={"/keys"} component={Keys} />
        <PrivateRoute path={"/engine/:id"} component={EngineScreen} />
        <PrivateRoute
          path={"/engine/:id/collaborators"}
          component={PermissionsScreen}
          type="engine"
        />
        <PrivateRoute
          path={"/db/:id/collaborators"}
          component={PermissionsScreen}
          type="db"
        />
        <PrivateRoute
          path={"/"}
          component={() => {
            return (
              <VersionNumber
                style={{ padding: "12px 0px 12px 0px", color: "#999" }}
              >{`${AppName.Display} v ${packageInfo.version} - powered by Neo4j`}</VersionNumber>
            );
          }}
        />
      </div>
    );
  }
}

export default withRouter(App);
