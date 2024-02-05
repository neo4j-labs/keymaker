import {
  createUser,
  getCurrentUser,
  searchUserByEmail,
  getUserRolesForNode,
  addUserRoleToNode,
  removeUserRoleFromNode,
  editUserRoleOnNode,
  leaveNode,
  loginUser,
  acceptedEula,
  createUserSignUp,
  isAdmin,
  isCurrentUser,
  logInLocalUser,
  checkLicense,
  getLicenseTypeAndExpiration,
  setEulaEnterprise,
} from "./../models/users";

import {
  isBasicLicense,
  getLicenseExpirationInfo,
} from "../util/license/license";

export default {
  Query: {
    getCurrentUser: async (root, args, context) => {
      return await getCurrentUser(context);
    },
    searchUserByEmail: async (root, { email }, context) => {
      return await searchUserByEmail(email, context);
    },
    getUserRolesForEngine: async (root, id, context, info) => {
      return await getUserRolesForNode(id, context, "Engine");
    },
    getUserRolesForDB: async (root, id, context, info) => {
      return await getUserRolesForNode(id, context, "DBConnection");
    },
    loginUser: async (root, { input }, context, info) => {
      return await loginUser(input);
    },
    acceptedEula: async (root, { email }, context, info) => {
      return await acceptedEula(email);
    },
    checkLicense: async (root, { email }, context, info) => {
      return await checkLicense(email);
    },
    getLicenseTypeAndExpiration: async (root, { email }, context, info) => {
      return await getLicenseTypeAndExpiration(email);
    },
  },
  Mutation: {
    createUser: async (root, args, context, info) => {
      var licenseExpirationInfo = getLicenseExpirationInfo();
      if (licenseExpirationInfo.licenseExpired) {
        throw new Error("Keymaker license expired");
      }
      return await createUser(context);
    },
    createUserSignUp: async (root, { input }, context, info) => {
      if (isBasicLicense()) {
        throw new Error("Creating users is not available in Keymaker Basic");
      }

      var licenseExpirationInfo = getLicenseExpirationInfo();
      if (licenseExpirationInfo.licenseExpired) {
        throw new Error("Keymaker license expired");
      }
      return await createUserSignUp(input);
    },
    addUserRoleToEngine: async (root, { input }, context, info) => {
      var licenseExpirationInfo = getLicenseExpirationInfo();
      if (licenseExpirationInfo.licenseExpired) {
        throw new Error("Keymaker license expired");
      }
      return await addUserRoleToNode(input, context, "Engine");
    },
    editUserRoleOnEngine: async (root, { input }, context, info) => {
      var licenseExpirationInfo = getLicenseExpirationInfo();
      if (licenseExpirationInfo.licenseExpired) {
        throw new Error("Keymaker license expired");
      }
      return await editUserRoleOnNode(input, context, "Engine");
    },
    removeUserRoleFromEngine: async (root, { input }, context, info) => {
      var licenseExpirationInfo = getLicenseExpirationInfo();
      if (licenseExpirationInfo.licenseExpired) {
        throw new Error("Keymaker license expired");
      }
      return await removeUserRoleFromNode(input, context, "Engine");
    },
    leaveEngine: async (root, { input }, context, info) => {
      var licenseExpirationInfo = getLicenseExpirationInfo();
      if (licenseExpirationInfo.licenseExpired) {
        throw new Error("Keymaker license expired");
      }
      return await leaveNode(input, context, "Engine");
    },
    addUserRoleToDB: async (root, { input }, context, info) => {
      var licenseExpirationInfo = getLicenseExpirationInfo();
      if (licenseExpirationInfo.licenseExpired) {
        throw new Error("Keymaker license expired");
      }
      return await addUserRoleToNode(input, context, "DBConnection");
    },
    editUserRoleOnDB: async (root, { input }, context, info) => {
      var licenseExpirationInfo = getLicenseExpirationInfo();
      if (licenseExpirationInfo.licenseExpired) {
        throw new Error("Keymaker license expired");
      }
      return await editUserRoleOnNode(input, context, "DBConnection");
    },
    removeUserRoleFromDB: async (root, { input }, context, info) => {
      var licenseExpirationInfo = getLicenseExpirationInfo();
      if (licenseExpirationInfo.licenseExpired) {
        throw new Error("Keymaker license expired");
      }
      return await removeUserRoleFromNode(input, context, "DBConnection");
    },
    leaveDB: async (root, { input }, context, info) => {
      var licenseExpirationInfo = getLicenseExpirationInfo();
      if (licenseExpirationInfo.licenseExpired) {
        throw new Error("Keymaker license expired");
      }
      return await leaveNode(input, context, "DBConnection");
    },
    logInLocalUser: async (obj, { email }, context, resolveInfo) => {
      var licenseExpirationInfo = getLicenseExpirationInfo();
      if (licenseExpirationInfo.licenseExpired) {
        throw new Error("Keymaker license expired");
      }
      return await logInLocalUser(email);
    },
    setEulaEnterprise: async (obj, { email }, context, resolveInfo) => {
      var licenseExpirationInfo = getLicenseExpirationInfo();
      if (licenseExpirationInfo.licenseExpired) {
        throw new Error("Keymaker license expired");
      }
      return await setEulaEnterprise(email);
    },
  },
  User: {
    isAdmin: async (User) => {
      return await isAdmin(User.email);
    },
    isCurrentUser: async (User, {}, context) => {
      return await isCurrentUser(User.email, context);
    },
  },
};
