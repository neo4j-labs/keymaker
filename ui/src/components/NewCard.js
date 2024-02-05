import React from "react";
import PropTypes from "prop-types";
import { Icon } from "semantic-ui-react";
import styled from "styled-components";

const NewCardWrapper = styled.div`
  height: ${props => (props.height ? props.height : "250px")};
  width: ${props => (props.width ? props.width : "auto")};
  border-radius: 12px;
  border: 1px dashed #5c7080;
  border: 1px dashed white;
  color: #63b344;
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  line-height: 40px;
  font-weight: bold;

  &:hover {
    background: #ced5e385;
    cursor: pointer;
  }
`;

class NewCard extends React.Component {
  state = {
    showingForm: false
  };

  showForm = () => this.setState({ showingForm: true });

  dismissForm = () => this.setState({ showingForm: false });

  submitForm = data => {
    this.props.submitForm(data);
    this.dismissForm();
  };

  render() {
    const Form = this.props.form;
    const { height, width } = this.props;
    return this.state.showingForm && Form !== undefined ? (
      <Form dismissForm={this.dismissForm} submitForm={this.submitForm} />
    ) : (
      <NewCardWrapper onClick={this.showForm} height={height} width={width}>
        <Icon name="plus circle" size="big" />
        {this.props.text}
      </NewCardWrapper>
    );
  }
}

NewCard.propTypes = {
  form: PropTypes.func,
  submitForm: PropTypes.func,
  text: PropTypes.string
};

export default NewCard;
