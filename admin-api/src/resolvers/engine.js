import {
  findEngineByID,
  createEngine,
  deleteEngine,
  editEngine,
  allEnginesForUser,
  getUsersForEngine,
  importEngine,
  getCreatedAt,
  canCurrentUserEdit,
  canCurrentUserDelete,
  runBatchEngine,
  cancelBatchEngine,
  isBatchEngineRunning,
  canUserAddEngine
} from "../models/engine";
import { updateEngineCache } from "../util/engine.js";
import { getLicenseExpirationInfo } from "../util/license/license";

export default {
  Query: {
    engine: async (root, { id }, context, info) => {
      return await findEngineByID(id, context);
    },
    allEnginesForUser: async (root, { id }, context) => {
      return await allEnginesForUser(context);
    },
    runBatchEngine: async (root, args, context, info) => {
      return await runBatchEngine(args);
    },
    isBatchEngineRunning: async (root, args, context, info) => {
      return await isBatchEngineRunning(args);
    },
    cancelBatchEngine: async (root, args, context, info) => {
      return await cancelBatchEngine(args);
    },
    canUserAddEngine: async (root, args, context, info) => {
      return await canUserAddEngine(context);
    },
  },
  Mutation: {
    createEngine: async (root, { input }, context, info) => {
      var licenseExpirationInfo = getLicenseExpirationInfo();
      if (licenseExpirationInfo.licenseExpired) {
        throw new Error("Keymaker license expired");
      }
      return await createEngine(input, context);
    },
    editEngine: async (root, { id, dbConnectionID, input }, context, info) => {
      var licenseExpirationInfo = getLicenseExpirationInfo();
      if (licenseExpirationInfo.licenseExpired) {
        throw new Error("Keymaker license expired");
      }
      const result = await editEngine(id, dbConnectionID, input, context);
      updateEngineCache({ id, updateByDependency: false });
      return result;
    },
    deleteEngine: async (root, { id }, context, info) => {
      var licenseExpirationInfo = getLicenseExpirationInfo();
      if (licenseExpirationInfo.licenseExpired) {
        throw new Error("Keymaker license expired");
      }
      const result = await deleteEngine(id, context);
      updateEngineCache({ id, updateByDependency: false });
      return result;
    },
    importEngine: async (root, { id, engine }, context, info) => {
      var licenseExpirationInfo = getLicenseExpirationInfo();
      if (licenseExpirationInfo.licenseExpired) {
        throw new Error("Keymaker license expired");
      }
      const result = await importEngine(id, engine, context);
      updateEngineCache({ id, updateByDependency: false });
      return result;
    },
  },
  Engine: {
    users: async (Engine) => {
      return await getUsersForEngine(Engine.id);
    },
    createdAt: async (Engine) => {
      return await getCreatedAt(Engine.id);
    },
    canCurrentUserEdit: async (Engine, { }, context) => {
      return await canCurrentUserEdit(Engine.id, context);
    },
    canCurrentUserDelete: async (Engine, { }, context) => {
      return await canCurrentUserDelete(Engine.id, context);
    },
  },
};
