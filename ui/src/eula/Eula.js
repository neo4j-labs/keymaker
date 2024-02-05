import React, { useState } from "react";
import { login, checkLicense, setEulaEnterprise } from "../auth/auth2";
import history from "../auth/history";
import { Button, Radio } from "semantic-ui-react";

import Wrapper from "./Wrapper";

const Eula = (props) => {
  const email = props.match.params.email;
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [agreedToEula, setAgreedToEula] = useState(false);

  const handleLogIn = async () => {
    const licenseStatus = await checkLicense();
    if (licenseStatus === "Basic") {
      if (agreedToEula) {
        login(email);
      } else {
        setSnackbarOpen(true);
      }
    } else {
      if (agreedToEula) {
        setEulaEnterprise(email);
      } else {
        setSnackbarOpen(true);
      }
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
          checked={agreedToEula}
          onClick={() => setAgreedToEula(!agreedToEula)}
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
          onClick={() => {
            if (localStorage.getItem('licenseType') === "Basic") {
              history.replace("/your-email")
            } else {
              history.replace("/login");
            }
          }}
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
          primary
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

export default Eula;
