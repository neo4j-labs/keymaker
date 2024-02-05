import styled from "styled-components";

const Divider = styled.span`
  width: 1px;
  height: ${(props) => props.height};
  margin: ${(props) => (props.noMargin ? "0px" : "0px 12px")};
`;

export default Divider;
