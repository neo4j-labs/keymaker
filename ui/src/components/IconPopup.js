import React from "react";
import PropTypes from "prop-types";
import { Popup, Icon } from "semantic-ui-react";

const style = {
  borderRadius: 0,
  opacity: 0.9,
  padding: "1em",
};

const IconPopup = ({ iconName, popupContent, onClick, iconSize }) => (
  <div style={{ cursor: "pointer" }}>
    <Popup
      inverted
      style={style}
      position="top center"
      trigger={<Icon name={iconName} onClick={onClick} size={iconSize} />}
      content={popupContent}
    />
  </div>
);

IconPopup.propTypes = {
  iconName: PropTypes.string.isRequired,
  popupContent: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  size: PropTypes.string,
};

export default IconPopup;
