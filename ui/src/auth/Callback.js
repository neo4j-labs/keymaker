import React, { Component } from "react";
import auth from "./auth";
import { getDynamicConfigValue } from "../dynamicConfig";

class Callback extends Component {
  state = {
    err: null
  }

  async componentDidMount() {
    try {
      await auth.handleAuthentication();
      window.location.replace(getDynamicConfigValue("REACT_APP_REDIRECT_URL"));
    } catch (err) {
      this.setState({err: err});
    }
    
  }
  render() {
    const style = {
      position: "absolute",
      display: "flex",
      justifyContent: "center",
      height: "100vh",
      width: "100vw",
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: "white",
    };
    const { err } = this.state;
    if (err) {
      console.log('Error during authentication')
      return (
        <>
          <div style={style}>Error during authenication: {`${err}`}</div>
          <a href={getDynamicConfigValue("REACT_APP_REDIRECT_URL")}>Click here to try again</a>
        </>
      )
    } else {
      return (
        <div style={style}>Verifying authentication...</div>
      )
    }
    
  }
}

export default Callback;
