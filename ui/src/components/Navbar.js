import React from "react";
import { Query } from "@apollo/client/react/components";
import styled from "styled-components";
import { Icon, Dropdown } from "semantic-ui-react";
import { Link, withRouter } from "react-router-dom";
import UserPortrait from "./UserPortrait";
import "../App.css";
import { logout } from "../auth/auth2";
import auth from "../auth/auth";
import { getDynamicConfigValue } from "../dynamicConfig";

import Button from "./Button";

import { GET_CURRENT_USER } from "../graphql/user";

const NavbarContainer = styled.div`
  min-width: 100%;
  height: 65px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30px 0 30px;
  min-width: 700px;
`;

const ItemRow = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const Title = styled.span`
  letter-spacing: 0.025em;
`;

const Subtitle = styled.span`
  white-space: nowrap;
`;

const TitleContainer = styled.div`
  margin-left: 8px;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
`;

const Defaults = {
  LogoHeight: 30
}

// this is because the logoheight is sized for Hive, we need to adjust it for this demo
const LogoHeightMultiplier = 32/36;

const getLogoHeight = (logoheight) => {
  var returnVal = '';
  if (logoheight && typeof(logoheight) === 'number') {
    returnVal = Math.floor(LogoHeightMultiplier * logoheight);
  } else {
    returnVal = Defaults.LogoHeight
  }
  return `${returnVal}px`;
}

const Navbar = (props) => {
  const { brandingInfo } = props;
  const { logourl, logoheight, primaryColor, secondaryColor } = 
  brandingInfo.logourl !== undefined
  ? brandingInfo
  : {
      logourl:
        "https://dist.neo4j.com/wp-content/uploads/20210422140034/Neo4j-logo_color.png",
      logoheight: 36,
      primaryColor: "#FFFFFF",
      secondaryColor: "#000000"
    };

  const className = (primaryColor) ? '' : 'white-background';
  const navBarStyle = (primaryColor) ? { background: primaryColor, borderBottom: '3px solid gray' } : {}
  const textStyle = (secondaryColor) ? { color: secondaryColor } : {}

  const options = [
    { key: "sign-out", value: "sign-out", text: "Sign Out", selected: false },
  ];

  const handleDropdownClick = (value) => {
    if (value === "sign-out") {
      if (getDynamicConfigValue("REACT_APP_AUTH_METHOD") === "auth0")
        auth.logout();
      else {
        logout();
      }
    }
  };

  return (
    <NavbarContainer className={className} style={navBarStyle}>
      <ItemRow>
        <Link to="/">
          {logourl ? 
            <img
              height={getLogoHeight(logoheight)}
              width="auto"
              src={logourl}
              alt="Logo"
              style={{marginRight: '12px'}}
            />
            :
            <img
              height="35px"
              width="auto"
              src="https://go.neo4j.com/rs/710-RRC-335/images/neo4j_logo_globe.png?_ga=2.170798312.974307407.1536800819-1299435698.1522112743"
              alt="Neo4j Logo"
            />
          }
        </Link>
        <TitleContainer>
          <Link to="/">
            <Title className="text-xl blue" style={textStyle}>Keymaker</Title>
          </Link>
          <Subtitle className="text-thin grey hidden-on-mobile" style={textStyle}>
            Applied Analytics Framework
          </Subtitle>
        </TitleContainer>
      </ItemRow>
      <ItemRow>
        <Query query={GET_CURRENT_USER}>
          {({ loading, error, data }) => {
            if (loading) return <></>;
            if (error) return <></>;
            const { user } = data;
            return (
              <ItemRow>
                <UserPortrait style={textStyle}
                  email={user ? user.email : ""}
                  // name={user ? user.name : ""}
                  picture={user ? user.picture : ""}
                />
                <Dropdown
                  icon={null}
                  options={options}
                  selectOnBlur={false}
                  pointing="top right"
                  trigger={
                    <Button
                      narrow
                      height="35px"
                      darkenOnHover
                      className="margin-left-small light-grey-background black"
                      style={textStyle}
                    >
                      <Icon name="bars"></Icon>
                    </Button>
                  }
                  onChange={(e, { value }) => {
                    handleDropdownClick(value);
                  }}
                />
              </ItemRow>
            );
          }}
        </Query>
      </ItemRow>
    </NavbarContainer>
  );
};

export default withRouter(Navbar);
