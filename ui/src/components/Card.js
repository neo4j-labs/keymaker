import styled from "styled-components";
import PropTypes from "prop-types";

const Card = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: ${(props) => (props.width ? props.width : "auto")};
  height: ${(props) => (props.height ? props.height : "auto")};
  box-shadow: ${(props) =>
    props.noShadow
      ? "none"
      : "0 3px 6px 0 rgba(0, 0, 0, 0.05), 0 6px 20px 0 rgba(0, 0, 0, 0.025)"};
  border-radius: 3px;
  background: white;
  border: 1px solid transparent;
  &:hover {
    cursor: ${(props) => (props.pointerOnHover ? "pointer" : "")};
    opacity: ${(props) => (props.lightenOnHover ? "0.75" : "1")};
    border: ${(props) =>
      props.borderOnHover ? "1px solid " + props.borderColor : ""};
    transition-duration: 0.15s;
    transition-timing-function: ease-out;
  }
`;

Card.propTypes = {
  height: PropTypes.string,
  width: PropTypes.string,
};

export default Card;
