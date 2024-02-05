import React from "react";
import styled from "styled-components";
import Button from "./Button";
import DisabledButton from "./DisabledButton";
import { Icon } from "semantic-ui-react";
import { Query } from "@apollo/client/react/components";

import { CAN_USER_ADD_ENGINES } from "../graphql/engine";

import "../App.css";

const StyledButton = styled(Button)`
  background: white;
  color: rgba(0, 0, 0, 0.8);
`;

const DisabledStyledButton = styled(DisabledButton)`
  background: rgb(160,160,160);
  color: rgba(0, 0, 0, 0.8);
`;

const NewEntityButton = ({ text, onClick }) => (
  <Query query={CAN_USER_ADD_ENGINES}>
    {({ data, loading, error }) => {
      if (loading) return null;
      if (error) return `Error!`;
      const userAllowed = data.canUserAddEngine ? data.canUserAddEngine : false;
      // const userAllowed = false;
      return (
        <>
          {userAllowed &&
            <StyledButton
              darkenOnHover
              disabled={!userAllowed}
              onClick={onClick}
              className="text-small text-normal black"
            >
              {text} <Icon name="plus circle" size="large" className="blue" />
            </StyledButton>
          }
          {!userAllowed &&
            <DisabledStyledButton
              darkenOnHover
              disabled={!userAllowed}
              onClick="return false;"
              className="text-small text-normal black"
            >
              {text} <Icon name="plus circle" size="large" className="blue" />
            </DisabledStyledButton>
          }
        </>
      );
    }}
  </Query>
);

export default NewEntityButton;
