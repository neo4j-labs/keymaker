import {
  editPhaseInDB,
  writePhaseToDB,
  deletePhaseFromDB,
} from "./../models/phase";
import { updateEngineCache } from "../util/engine.js";
import { getLicenseExpirationInfo } from "../util/license/license";

export default {
  Mutation: {
    createPhase: async (
      root,
      { engineID, prevPhaseID, phaseType, input },
      context,
      info
    ) => {
      var licenseExpirationInfo = getLicenseExpirationInfo();
      if (licenseExpirationInfo.licenseExpired) {
        throw new Error("Keymaker license expired");
      }
      const result = await writePhaseToDB(
        engineID,
        prevPhaseID,
        phaseType,
        input,
        context
      );
      updateEngineCache({ id: engineID, updateByDependency: false });
      return result;
    },
    editPhase: async (root, { id, input }, context, info) => {
      var licenseExpirationInfo = getLicenseExpirationInfo();
      if (licenseExpirationInfo.licenseExpired) {
        throw new Error("Keymaker license expired");
      }
      const result = await editPhaseInDB(id, input, context);
      updateEngineCache({ id, updateByDependency: true });
      return result;
    },
    deletePhase: async (root, { id }, context, info) => {
      var licenseExpirationInfo = getLicenseExpirationInfo();
      if (licenseExpirationInfo.licenseExpired) {
        throw new Error("Keymaker license expired");
      }
      const result = await deletePhaseFromDB(id, context);
      updateEngineCache({ id, updateByDependency: true });
      return result;
    },
  },
  Phase: {
    __resolveType(phase, context, info) {
      return phase.phaseType;
    },
  },
};
