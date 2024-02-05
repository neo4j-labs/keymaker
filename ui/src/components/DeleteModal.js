import React from "react";
import PropTypes from "prop-types";
import styled from "styled-components";
import { Modal, Header } from "semantic-ui-react";

import Button from "./Button";

import "../App.css";

const ActionWrapper = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

const DeleteModal = ({
  isOpen,
  headerContent,
  content,
  onClose,
  onDelete,
  buttonName,
}) => (
  <Modal open={isOpen} onClose={onClose} closeIcon size="tiny">
    <Header className="text-normal text-med black" content={headerContent} />
    <Modal.Content>
      <p className="text-small text-thin grey">{content}</p>
    </Modal.Content>
    <Modal.Actions>
      <ActionWrapper>
        <Button
          noShadow
          darkenOnHover
          className="light-grey-background text-normal text-small black margin-right-small"
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button
          noShadow
          lightenOnHover
          className="red-border red white-background text-normal"
          onClick={() => {
            onDelete();
            onClose();
          }}
        >
          {buttonName ? buttonName : "Delete"}
        </Button>
      </ActionWrapper>
    </Modal.Actions>
  </Modal>
);

DeleteModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  headerContent: PropTypes.string,
  content: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default DeleteModal;
