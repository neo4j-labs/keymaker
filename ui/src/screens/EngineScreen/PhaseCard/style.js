import styled from "styled-components";
import TextareaAutosize from 'react-textarea-autosize';

export const NoEdit = styled.div`
  // pointer-events: none;
`;

export const InnerWrapper = styled.div`
  padding: 15px 20px 20px;
  display: flex;
  flex-direction: column;
`;

export const OuterWrapper = styled.div`
  margin-bottom: 20px;
`;

export const HeaderWrapper = styled.div`
  display: flex;
  justify-content: space-between;
`;

export const Title = styled.h3`
  max-width: 550px;
  margin: 0px 5px 0px 0px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  line-height: 1.25em;
  max-height: 2.5;
`;

export const PhaseType = styled.div`
  margin-bottom: 6px;
`;

export const PhaseDescription = styled.div`
  margin-bottom: 6px;
`;

export const CypherQueryEditor = styled(TextareaAutosize)`
  border: 1px solid #008ac3;
  color: rgba(0, 0, 0, 0.7);
  padding: 10px;
  border-radius: 6px;
  font-family: monospace;
  margin-top: 12px;
  width: 100%;
`;

export const InvertedLabel = styled.span`
  font-weight: bold;
  margin-top: 12px;
`;

export const MaxAmountLabel = styled.span`
  font-weight: bold;
  margin-top: 12px;
`;

// i {
//   font-size: 1.1em;
//   color: rgba(0, 0, 0, 0.5);
//   cursor: pointer;
//   margin-left: 5px;
//   transition-duration: 0.15s;
// }

// i:hover {
//   /* transform: translateY(-1px); */
//   color: rgba(0, 0, 0, 0.7);
//   /* font-size: 1.2em; */
//   transition-duration: 0.15s;
// }

// i:active {
//   /* font-size: 1em; */
//   transition-duration: 0.15s;
// }

// i.trash:hover {
//   color: #e86767;
// }
