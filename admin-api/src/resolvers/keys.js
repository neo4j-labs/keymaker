import { createAPIKeyForOrg, createAPIKey, updateAPIKey } from "../models/keys";

export default {
  Mutation: {
    createAPIKeyForOrg: async (root, args, context, info) => {
      const { org, duration } = args;
      return await createAPIKeyForOrg(org, duration, context);
    },    
    createAPIKey: async (root, args, context, info) => {
      const { duration } = args;
      return await createAPIKey(duration, context);
    },
    updateAPIKey: async (root, args, context, info) => {
      const { key, duration } = args;
      return await updateAPIKey(key, duration, context);
    },
  },
};
