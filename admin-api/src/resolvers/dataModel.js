import { updateCWPermissions, allDataModelsForUser } from "../models/dataModel";

export default {
  Query: {
    allDataModelsForUser: async (root, args, context) => {
      const { dataModelKey } = args;
      return await allDataModelsForUser(dataModelKey, context);
    },
  },
  Mutation: {
    updateCWPermissions: async (root, args, context) => {
      return await updateCWPermissions(args, context);
    },
  },
};
