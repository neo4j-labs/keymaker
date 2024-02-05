import { PhaseSet } from "../util/constants";

export const getPhaseFromPhaseNode = (node) => {
  const phase = {
    ...node.properties,
    phaseType: getPhaseType(node),
  };
  if (!("description" in phase)) phase.description = "";
  return phase;
};

const getPhaseType = (node) => {
  return node.labels.filter((label) => PhaseSet.has(label))[0];
};
