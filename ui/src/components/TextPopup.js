import React from "react";
import PropTypes from "prop-types";
import { Popup } from "semantic-ui-react";

const style = {
  borderRadius: 0,
  opacity: 0.9,
  padding: "1em"
};

const TextPopup = ({ text }) => (
  <Popup inverted trigger={<div>{text}</div>} content={text} style={style} />
);

TextPopup.propTypes = {
  text: PropTypes.string.isRequired
};

export default TextPopup;
