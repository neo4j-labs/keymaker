import React from "react";
import styled from "styled-components";
import { Modal } from "semantic-ui-react";

import Button from "./Button";

import "../App.css";

const Container = styled.div`
  padding: 20px 25px 15px 25px;
`;

const Controls = styled.div`
  display: flex;
  margin-top: 20px;
  justify-content: space-between;
`;

const FormModal = ({
  isOpen,
  onClose,
  onSubmit,
  buttonName,
  children,
  size,
}) => (
  <Modal open={isOpen} onClose={onClose} closeIcon size={size}>
    <Container>
      {children}
      <Controls>
        <Button
          darkenOnHover
          className="light-grey-background black text-small text-normal"
          noShadow
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button
          lightenOnHover
          className="blue-background white text-small text-normal"
          noShadow
          onClick={onSubmit}
        >
          {buttonName}
        </Button>
      </Controls>
    </Container>
  </Modal>
);

export default FormModal;
