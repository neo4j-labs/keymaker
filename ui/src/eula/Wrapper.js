import React from "react";
//import { Build } from "@material-ui/icons";
import { Icon } from "semantic-ui-react";
// import MuiAlert from "@material-ui/lab/Alert";
import { Message } from "semantic-ui-react";

const Wrapper = (props) => {
  // const Alert = (props) => {
  //   return <MuiAlert elevation={6} variant="filled" {...props} />;
  // };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexDirection: "column",
        minHeight: "750px",
        minWidth: "750px",
      }}
    >
      {props.snackbarOpen ? (
        <Message
          onDismiss={() => props.setSnackbarOpen(false)}
          error
          header={props.snackbarMessage}
        />
      ) : null}
      <div
        style={{
          width: "100%",
          height: "100px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0px 48px",
        }}
      >
        <div
          style={{
            width: "300px",
            color: "#37474f",
            fontSize: "30px",
            fontFamily: "lato",
            fontWeight: "700",
          }}
        >
          Keymaker
        </div>
        <div
          style={{
            height: "60px",
            width: "60px",
            borderRadius: "50%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            border: "3px solid #2E8CC1",
          }}
        >
          <Icon name="key" style={{ color: "#2E8CC1", fontSize: 30 }} />
        </div>
        <div
          style={{
            width: "300px",
            fontFamily: "lato",
            fontWeight: "300",
            fontSize: "14px",
            textAlign: "end",
          }}
        >
          neo4j
        </div>
      </div>
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          //   borderTop: "1px solid #37474f",
          //   borderBottom: "1px solid #37474f",
        }}
      >
        {props.children}
      </div>
      <div
        style={{
          width: "100%",
          height: "80px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          padding: "0px 48px",
          fontFamily: "lato",
          fontWeight: "300",
          fontSize: "14px",
        }}
      >
        <div style={{ fontWeight: "400" }}>have questions?</div>
        <div style={{ height: "6px" }}></div>
        <div>
          contact{" "}
          <a style={{ cursor: "pointer", textDecoration: "underline" }}>
            solutions@neo4j.com
          </a>
        </div>
      </div>
      {/* <Alert onClose={() => props.setSnackbarOpen(false)} severity="error">
          {props.snackbarMessage}
        </Alert> 
    </Message>*/}
    </div>
  );
};

export default Wrapper;
