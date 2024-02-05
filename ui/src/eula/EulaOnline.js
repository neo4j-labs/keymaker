import React, { useState } from "react";
//import auth from "../../auth/localAuth";
import history from "../../auth/history";
import { Button, Radio, Snackbar } from "@material-ui/core";
import auth from "../../auth/auth0";
import Wrapper from "./Wrapper";

const EulaOnline = () => {
  //const email = props.match.params.email;
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [agreedToLicense, setAgreedToLicense] = useState(false);
  var currentUser = auth.getCurrentUser();
  if (auth.currentUserHasAcceptedEula()) {
    history.replace("/");
  }
  const handleLogIn = () => {
    if (agreedToLicense) {
      auth.updateAppMetadata(auth.getIdTokenPayload()).then((result) => {
        console.log(result);
        if (result === "success") {
          history.replace("/");
        }
      });
    } else {
      setSnackbarOpen(true);
    }
  };

  return (
    <Wrapper
      snackbarOpen={snackbarOpen}
      setSnackbarOpen={setSnackbarOpen}
      snackbarMessage={"Oops! You need to accept the license agreement."}
    >
      <div
        style={{
          width: "550px",
          color: "#37474f",
          fontSize: "24px",
          fontFamily: "lato",
          fontWeight: "500",
        }}
      >
        License Agreement
      </div>
      <div style={{ height: "24px" }} />
      <embed
        style={{
          height: "350px",
          width: "550px",
          overflowY: "scroll",
          border: "1px solid #cfd8dc",
          padding: "24px",
        }}
        src={
          localStorage.getItem('licenseType') !== "Enterprise"
            ? `${process.env.PUBLIC_URL}/KeymakerEULABasic.html`
            : `${process.env.PUBLIC_URL}/KeymakerEULACommercial.html`
        }
      ></embed>
      <div style={{ height: "12px" }} />
      <div style={{ width: "550px", display: "flex", alignItems: "center" }}>
        <Radio
          checked={agreedToLicense}
          onClick={() => setAgreedToLicense(!agreedToLicense)}
          style={{ color: "#2E8CC1" }}
        />
        <div
          style={{ fontFamily: "lato", fontWeight: "300", fontSize: "14px" }}
        >
          I agree to the terms and conditions in the above license agreement
          {/*}<a style={{ cursor: "pointer", textDecoration: "underline" }}>here</a>*/}
        </div>
      </div>
      <div style={{ height: "24px" }} />
      <div
        style={{
          width: "550px",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Button
          variant="contained"
          color="default"
          onClick={() => auth.logout()}
          style={{
            height: "50px",
            width: "270px",
            fontFamily: "lato",
            fontWeight: "700",
          }}
        >
          Decline
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleLogIn()}
          style={{
            height: "50px",
            width: "270px",
            fontFamily: "lato",
            fontWeight: "700",
          }}
        >
          Accept
        </Button>
      </div>
    </Wrapper>
  );
};

export default EulaOnline;
