import React from "react";
import styled from "styled-components";
import { Modal, Icon, Header } from "semantic-ui-react";
import Button from "../../components/Button";

import "../../App.css";

const Controls = styled.div`
  display: flex;
  justify-content: space-between;
`;

const ExportModal = ({ isOpen, onClose, json }) => {
  return (
    <Modal open={isOpen} onClose={onClose} size="small">
      <Header className="text-normal text-med black" content="JSON Export" />
      <Modal.Content>
        <div className="grey text-thin">{JSON.stringify(json)}</div>
      </Modal.Content>
      <Modal.Actions>
        <Controls>
          <Button
            darkenOnHover
            className="light-grey-background black text-small text-normal margin-right-small"
            noShadow
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            darkenOnHover
            className="blue-background white text-small text-normal"
            noShadow
            onClick={() => {
              onClose();
              navigator.clipboard.writeText(JSON.stringify(json));
            }}
          >
            <Icon name="copy outline" />
            <span className="margin-left-tiny">Copy</span>
          </Button>
        </Controls>
      </Modal.Actions>
    </Modal>
  );
};

export default ExportModal;
