import React from "react";
import { Image } from "semantic-ui-react";

import "../App.css";

const UserPortrait = ({ email, picture }) => {
  const colors = ["#d46b08", "#531dab", "#5b8c00", "#ff9c6e", "#096dd9"];
  if (picture) {
    return <Image avatar size="mini" src={picture} />;
  } else {
    return (
      <div
        style={{
          width: "35px",
          height: "35px",
          borderRadius: "17.5px",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors[Math.floor(Math.random() * colors.length)],
        }}
      >
        {email.charAt(0).toUpperCase()}
      </div>
    );
  }
};

export default UserPortrait;
