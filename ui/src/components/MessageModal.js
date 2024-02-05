import React from "react";
import styled from "styled-components";
import { Modal, Header } from "semantic-ui-react";

import "../App.css";

const Container = styled.div`
  padding: 25px 30px;
  display: flex;
  flex-direction: column;
`;

const Message = styled.div`
  font-size: 1em;
  line-height: 1.25em;
`;

const MessageModal = ({ isOpen, onClose, title, message }) => (
  <Modal open={isOpen} onClose={onClose} closeIcon size={"tiny"}>
    <Container>
      <Header className="black text-med text-bold" content={title} />
      <Message className="grey text-small text-thin">{message}</Message>
    </Container>
  </Modal>
);

export default MessageModal;
