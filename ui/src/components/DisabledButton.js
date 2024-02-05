import styled from "styled-components";

const DisabledButton = styled.button`
  font-size: 1em;
  font-weight: 500;
  padding-top: ${(props) => (props.thin ? "0.4em" : "0.7em")};
  padding-bottom: ${(props) => (props.thin ? "0.4em" : "0.7em")};
  padding-left: ${(props) => (props.narrow ? "0.8em" : "1.5em")};
  padding-right: ${(props) => (props.narrow ? "0.8em" : "1.5em")};
  width: ${(props) =>
            props.fluid ? "100%" : props.width ? props.width : "auto"};
  height: ${(props) =>
            props.fluid ? "100%" : props.height ? props.height : "auto"};
  border-radius: ${(props) =>
            props.borderRadius ? props.borderRadius : "2px"};
  font-family: Lato, "Helvetica Neue", Arial, Helvetica, sans-serif;
  box-shadow: ${(props) =>
            props.noShadow
                  ? "none"
                  : "0 3px 6px 0 rgba(0, 0, 0, 0.05), 0 6px 20px 0 rgba(0, 0, 0, 0.025)"};
  border: none;
  outline: none;
  font-weight: bold;
  text-align: center;
  transition-duration: 0.15s;
  transition-timing-function: ease-out;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    cursor: not-allowed;
    box-shadow: ${(props) =>
            props.darkenOnHover ? "inset 0 0 0 1000px rgba(0, 0, 0, 0.025)" : "none"};
    opacity: ${(props) => (props.lightenOnHover ? "0.75" : "1")};
    transition-duration: 0.15s;
    transition-timing-function: ease-out;
  }

  &:active {
    outline: none;
    transition-duration: 0.15s;
    transition-timing-function: ease-out;
  }
`;

export default DisabledButton;
