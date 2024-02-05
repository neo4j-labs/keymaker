import React, { useState } from "react";
import { Icon } from "semantic-ui-react";
import { Message } from "semantic-ui-react";

import EngineGrid from "./EngineGrid";
import DatabaseGrid from "./DatabaseGrid";
import Header from "./../../components/Header";
import ContentWrapper from "./../../components/ContentWrapper";

import "../../App.css";

const NUM_MILLIS_IN_DAY = 24 * 60 * 60 * 1000;
var licenseExpirationWarned = false;

const HomeScreen = () => {

  var snackbarMessage = '';
  var initialSnackbarOpenState = false;

  if (!licenseExpirationWarned) {
    var licenseExpiration = localStorage.getItem('licenseExpiration');
    if (licenseExpiration) {
      var value = parseInt(licenseExpiration);
      if (typeof(value) === 'number') {
        var timeRemaining = value - new Date().getTime();
        var numDaysRemaining = Math.floor(timeRemaining / NUM_MILLIS_IN_DAY) + 1;
        if (numDaysRemaining <= 30) {
          snackbarMessage = `WARNING: You have ${numDaysRemaining} day(s) left on your license`;
          initialSnackbarOpenState = true;
        } else if (numDaysRemaining < 0) {
          var licenseExpireDate = new Date(value).toLocaleDateString();
          snackbarMessage = `Your license expired on ${licenseExpireDate}, contact Neo4j to get a new license`;
          initialSnackbarOpenState = true;
        }
      }
    }
  }
  const [snackbarOpen, setSnackbarOpen] = useState(initialSnackbarOpenState);

  return (
    <ContentWrapper>
        {snackbarOpen ? (
          <Message
            onDismiss={() => {
              licenseExpirationWarned = true;
              setSnackbarOpen(false)
            }}
            error
            header={snackbarMessage}
          />
        ) 
        : 
        <></>
        }
      <Header className="text-large text-bold black">
        <Icon name="rocket" className="black"></Icon>
        <div className="margin-left-tiny">Engines</div>
      </Header>
      <EngineGrid />
      <div style={{ height: "15px" }} />
      <Header className="text-large text-bold black">
        <Icon name="database" className="black"></Icon>
        <div className="margin-left-tiny">Database Connections</div>
      </Header>
      <DatabaseGrid />
    </ContentWrapper>
  );
}

export default HomeScreen;
