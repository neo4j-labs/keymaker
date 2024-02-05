import {
  findDBConnection,
  allDBConnectionsForUser,
  createDBConnection,
  editDBConnection,
  deleteDBConnection,
  getDBInfo,
  getEngines,
  getUsers,
  canCurrentUserEdit,
  canCurrentUserDelete,
  getDatabases,
  getLabels,
  getCreatedAt,
  getPropertyNames,
} from "../models/dbConnection";
import { updateEngineCache } from "../util/engine.js";
import { getLicenseExpirationInfo } from "../util/license/license";

export default {
  Query: {
    dbConnection: async (root, { id }, context) => {
      return await findDBConnection(id, context);
    },
    allDBConnectionsForUser: async (root, args, context) => {
      return await allDBConnectionsForUser(context);
    },
  },
  Mutation: {
    createDBConnection: async (root, { input }, context) => {
      var licenseExpirationInfo = getLicenseExpirationInfo();
      if (licenseExpirationInfo.licenseExpired) {
        throw new Error("Keymaker license expired");
      }
      return await createDBConnection(input, context);
    },
    editDBConnection: async (root, { id, properties }, context) => {
      var licenseExpirationInfo = getLicenseExpirationInfo();
      if (licenseExpirationInfo.licenseExpired) {
        throw new Error("Keymaker license expired");
      }
      const result = await editDBConnection(id, properties, context);
      updateEngineCache({ id, updateByDependency: true });
      return result;
    },
    deleteDBConnection: async (root, { id }, context) => {
      var licenseExpirationInfo = getLicenseExpirationInfo();
      if (licenseExpirationInfo.licenseExpired) {
        throw new Error("Keymaker license expired");
      }
      return await deleteDBConnection(id, context);
    },
  },
  DBConnectionEx: {
    dbInfo: async (DBConnection) => {
      return await getDBInfo(DBConnection);
    },
    createdAt: async ({ id }) => {
      return await getCreatedAt(id);
    },
    engines: async (DBConnection) => {
      return await getEngines(DBConnection.id);
    },
    users: async (DBConnection) => {
      return await getUsers(DBConnection.id);
    },
    canCurrentUserEdit: async (DBConnection, {}, context) => {
      return await canCurrentUserEdit(DBConnection.id, context);
    },
    canCurrentUserDelete: async (DBConnection, {}, context) => {
      return await canCurrentUserDelete(DBConnection.id, context);
    },
    databases: async (DBConnection, {}) => {
      const databases = await getDatabases(DBConnection);
      return databases;
    },
    labels: async (DBConnection, { databaseName }) => {
      const labels = await getLabels(DBConnection, databaseName);
      return labels;
    },
    propertyNames: async (DBConnection, { label, databaseName }) => {
      const propertyNames = await getPropertyNames(
        DBConnection,
        label,
        databaseName
      );
      return propertyNames;
    },
  },
};
