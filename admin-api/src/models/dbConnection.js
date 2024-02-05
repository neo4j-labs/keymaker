import { runQuery, initializeDriver, getDriver } from "../util/db";
import { encrypt } from "../util/encryption/crypto";
import {
  LicenseRestriction,
  getLicenseRestriction,
} from "../util/license/license";

/*
  Keymaker DB methods  
*/

export const allDBConnectionsForUser = async (context) => {
  const query = `
    MATCH (db:DBConnection),(u:User {email: $email})
WHERE (u:Admin OR db.isPrivate = false OR exists((u)<-[:OWNER|MEMBER|VIEWER]-(db)))
          AND u.primaryOrganization IS NOT NULL 
          AND u.primaryOrganization IN labels(db)
RETURN db
  `;
  const result = await runQuery({
    query,
    driver: getDriver(),
    args: { email: context.email },
    database: process.env.NEO4J_DATABASE,
  });
  const dbConnections = result.records.map(
    (record) => record.get("db").properties
  );
  return dbConnections;
};

export const findDBConnection = async (id) => {
  const query = `
    MATCH (db:DBConnection {id: $id})
    RETURN db
  `;
  const result = await runQuery({
    query,
    args: { id },
    driver: getDriver(),
    database: process.env.NEO4J_DATABASE,
  });
  const dbConnection = result.records[0].get("db").properties;
  return dbConnection;
};

export const createDBConnection = async (args, context) => {
  const { name, url, user, password, isPrivate } = args;
  const maxNumberOfDatabases = getLicenseRestriction(
    LicenseRestriction.MaxNumberOfDatabases
  );
  const query = `
    WITH $email as email, $name as name, $url as url, $user as user, $password as password, $isPrivate as isPrivate, $maxNumberOfDatabases as maxNumberOfDatabases
    MATCH (u:User {email: email})
    //CALL apoc.util.validate(NOT(exists(u.primaryOrganization)), 'The calling User is not configured correctly', [0])
    CALL apoc.util.validate(u.primaryOrganization IS NULL, 'The calling User is not configured correctly', [0])
    OPTIONAL MATCH (existing:DBConnection)
    WITH u, name, url, user, password, isPrivate, maxNumberOfDatabases, COUNT(existing) AS numExistingConnections
    CALL apoc.util.validate(numExistingConnections >= maxNumberOfDatabases,"Max number of licensed database connections reached",[0])
    CREATE (u)<-[:CREATOR]-(db:DBConnection)
    CREATE (u)<-[:OWNER]-(db)
    SET db.id = apoc.create.uuid(), db.createdAt = timestamp(), db.name = $name, db.url = $url, db.user = $user, db.password = $password, db.isPrivate= $isPrivate
    WITH db, u
    CALL apoc.create.addLabels([db], [u.primaryOrganization]) YIELD node as dbConnectionNode
    RETURN db
  `;
  const result = await runQuery({
    query,
    args: {
      name,
      url,
      isPrivate,
      email: context.email,
      maxNumberOfDatabases,
      user: encrypt(user),
      password: encrypt(password),
    },
    driver: getDriver(),
    database: process.env.NEO4J_DATABASE,
  });
  return result &&
    result.constructor &&
    result.constructor.name === "Neo4jError"
    ? new Error(result.message)
    : result.records[0].get("db").properties;
};

export const editDBConnection = async (id, properties, context) => {
  const isEditingCredentials =
    "user" in properties &&
    "password" in properties &&
    properties.user !== "" &&
    properties.password !== "";
  if (isEditingCredentials) {
    properties.user = encrypt(properties.user);
    properties.password = encrypt(properties.password);
  } else {
    delete properties.user;
    delete properties.password;
  }
  const query = `
    MATCH (u:User {email: $email}), (db:DBConnection {id: $id})
    WHERE u.primaryOrganization IS NOT NULL 
          AND u.primaryOrganization IN labels(db) 
    CALL apoc.util.validate(NOT (EXISTS((u)<-[:OWNER|:MEMBER]-(db)) OR u:Admin),"permission denied",[0])
    //CALL apoc.util.validate(NOT(exists(u.primaryOrganization)), 'The calling User is not configured correctly', [0])
    CALL apoc.util.validate(u.primaryOrganization IS NULL, 'The calling User is not configured correctly', [0])
    SET db += $properties
    RETURN db
  `;
  const result = await runQuery({
    query,
    driver: getDriver(),
    database: process.env.NEO4J_DATABASE,
    args: { id, properties, email: context.email },
  });
  return result.records[0].get("db").properties;
};

export const deleteDBConnection = async (id, context) => {
  const query = `
    MATCH (u:User {email: $email} )
    MATCH (db:DBConnection {id: $id})
    WHERE u.primaryOrganization IS NOT NULL 
          AND u.primaryOrganization IN labels(db) 
    CALL apoc.util.validate(NOT (EXISTS((u)<-[:OWNER]-(db)) OR u:Admin),"permission denied",[0])
    //CALL apoc.util.validate(NOT(exists(u.primaryOrganization)), 'The calling User is not configured correctly', [0])
    CALL apoc.util.validate(u.primaryOrganization IS NULL, 'The calling User is not configured correctly', [0])
    CALL apoc.util.validate(EXISTS((:Engine)-[:CONNECTS_TO]->(db)),"cannot delete when engines are connected",[0])
    DETACH DELETE db
  `;
  const result = await runQuery({
    query,
    driver: getDriver(),
    args: { id, email: context.email },
    database: process.env.NEO4J_DATABASE,
  });
  const wereNodesDeleted = result.summary.counters._stats.nodesDeleted > 0;
  if (wereNodesDeleted) {
    return { id };
  }
};

export const getEngines = async (id) => {
  const query = `
    MATCH (db:DBConnection {id: $id})<-[:CONNECTS_TO]-(engine)
    RETURN engine
  `;
  const result = await runQuery({
    query,
    args: { id },
    driver: getDriver(),
    database: process.env.NEO4J_DATABASE,
  });
  return result.records.map((record) => record.get("engine").properties);
};

export const getUsers = async (id) => {
  const query = `
    MATCH (db:DBConnection {id: $id})
    MATCH (u:User)
    WHERE u.primaryOrganization IS NOT NULL AND u.primaryOrganization IN labels(db) 
    //CALL apoc.util.validate(NOT(exists(u.primaryOrganization)), 'The calling User is not configured correctly', [0])
    CALL apoc.util.validate(u.primaryOrganization IS NULL, 'The calling User is not configured correctly', [0])
    MATCH (u)<-[rel:OWNER|MEMBER|VIEWER]-(db)
    RETURN {role: type(rel), user: {email: u.email, picture: u.picture}} AS user
  `;
  const result = await runQuery({
    query,
    args: { id },
    driver: getDriver(),
    database: process.env.NEO4J_DATABASE,
  });
  return result.records.map((record) => record.get("user"));
};

export const canCurrentUserEdit = async (id, context) => {
  const query = `
    MATCH (u:User {email: $email}), (db:DBConnection {id: $id})
    WHERE u.primaryOrganization IS NOT NULL AND u.primaryOrganization IN labels(db) 
    //CALL apoc.util.validate(NOT(exists(u.primaryOrganization)), 'The calling User is not configured correctly', [0])
    CALL apoc.util.validate(u.primaryOrganization IS NULL, 'The calling User is not configured correctly', [0])
    RETURN (u:Admin OR EXISTS((db)-[:OWNER|MEMBER]->(u))) AS result
  `;
  const result = await runQuery({
    query,
    driver: getDriver(),
    args: { id, email: context.email },
    database: process.env.NEO4J_DATABASE,
  });
  return result.records[0].get("result");
};

export const canCurrentUserDelete = async (id, context) => {
  const query = `
  MATCH (u:User {email: $email}), (db:DBConnection {id: $id})
  WHERE u.primaryOrganization IS NOT NULL AND u.primaryOrganization IN labels(db) 
  //CALL apoc.util.validate(NOT(exists(u.primaryOrganization)), 'The calling User is not configured correctly', [0])
  CALL apoc.util.validate(u.primaryOrganization IS NULL, 'The calling User is not configured correctly', [0])
  RETURN (u:Admin OR EXISTS((db)-[:OWNER]->(u))) AS result
  `;
  const result = await runQuery({
    query,
    driver: getDriver(),
    args: { id, email: context.email },
    database: process.env.NEO4J_DATABASE,
  });
  return result.records[0].get("result");
};

export const getCreatedAt = async (id) => {
  const query = `
    MATCH (e:DBConnection {id: $id})
    WITH date(datetime({epochmillis: e.createdAt})) AS createdAt
    RETURN createdAt.month + '-' + createdAt.day + '-' + createdAt.year AS createdAt
  `;
  const result = await runQuery({
    query,
    args: { id },
    driver: getDriver(),
    database: process.env.NEO4J_DATABASE,
  });
  return result.records[0].get("createdAt");
};

/*
  Remote DB methods  
*/

// export const getDBInfo = async (dbConnection) => {
//   try {
//     const driver = initializeDriver({ dbConnection });
//     const query = `
//       CALL dbms.procedures() YIELD name WITH collect(name) AS procedures
//       CALL dbms.functions() YIELD name WITH procedures, collect(name) AS functions
//       WITH "apoc.cypher.run" IN procedures AND "apoc.cypher.runFirstColumnSingle" IN functions as hasApoc
//       CAll dbms.components() yield edition, versions
//       RETURN toUpper(edition) as license, versions, hasApoc
//     `;
//     const result = await runQuery({ driver, query });
//     const dbinfo = {
//       isConnected: true,
//       license: result.records[0].get("license"),
//       versions: result.records[0].get("versions"),
//       hasApoc: result.records[0].get("hasApoc"),
//     };
//     return dbinfo;
//   } catch (e) {
//     return {
//       license: "NA",
//       versions: ["NA"],
//       hasApoc: false,
//       isConnected: false,
//     };
//   }
// };

export const getDBInfo = async (dbConnection) => {
  try {
    const driver = initializeDriver({ dbConnection });

    const queryHasAPOCProcedures = `SHOW PROCEDURES YIELD name WHERE name = "apoc.cypher.run" return name`;
    const queryHasAPOCFunctions = `SHOW FUNCTIONS YIELD name WHERE name = "apoc.cypher.runFirstColumnSingle" return name`;
    const queryGetInfo = `CAll dbms.components() yield edition, versions
    RETURN toUpper(edition) as license, versions`;

    // TODO - maybe these queries should execute in parallel
    const resultGetInfo = await runQuery({ driver, query: queryGetInfo });
    const resultHasAPOCProcedures = await runQuery({ driver, query: queryHasAPOCProcedures });
    const resultHasAPOCFunctions = await runQuery({ driver, query: queryHasAPOCFunctions });
    const hasAPOCProcedures = resultHasAPOCProcedures.records.length > 0 && resultHasAPOCProcedures.records[0].get("name") === "apoc.cypher.run";
    const hasAPOCFuntions = resultHasAPOCFunctions.records.length > 0 && resultHasAPOCFunctions.records[0].get("name") === "apoc.cypher.runFirstColumnSingle";
    const hasApoc = hasAPOCProcedures && hasAPOCFuntions;
    const dbinfo = {
      isConnected: true,
      license: resultGetInfo.records[0].get("license"),
      versions: resultGetInfo.records[0].get("versions"),
      hasApoc: hasApoc
    };
    return dbinfo;
  } catch (e) {
    return {
      license: "NA",
      versions: ["NA"],
      hasApoc: false,
      isConnected: false,
    };
  }
};

export const getDatabases = async (dbConnection) => {
  let driver;
  let databases = new Set();
  try {
    driver = initializeDriver({ dbConnection });
    const query1 = "SHOW DATABASES YIELD name";
    const result1 = await runQuery({
      driver,
      args: {},
      query: query1,
      database: "system",
    });
    result1.records.map((record) => databases.add(record.get("name")));
    databases.add("default");
    return Array.from(databases).filter((name) => name !== "system");
  } catch (e) {
    try {
      const query2 =
        "CALL apoc.systemdb.execute('SHOW DATABASES') YIELD row RETURN row.name as name";
      const result2 = await runQuery({ driver, query: query2 });
      let databases = result2.records.map((record) => record.get("name"));
      databases.push("default");
      return Array.from(databases).filter((name) => name !== "system");
    } catch (e) {
      return ["default"];
    }
  }
};

export const getLabels = async (dbConnection, databaseName) => {
  try {
    const driver = initializeDriver({ dbConnection });
    const query = "CALL db.labels() YIELD label RETURN label";
    const result = await runQuery({
      driver,
      query,
      args: {},
      database: databaseName,
    });
    const labels = result.records.map((record) => record.get("label"));
    return labels;
  } catch (e) {
    return null;
  }
};

export const getPropertyNames = async (dbConnection, label, databaseName) => {
  try {
    const driver = initializeDriver({ dbConnection });
    const query = `
    CALL apoc.meta.nodeTypeProperties({labels: [\"${label}\"],sample: 50000}) yield propertyName as allfields return DISTINCT allfields
    `;
    const result = await runQuery({
      driver,
      query,
      args: {},
      database: databaseName,
    });
    const properties = result.records.map((record) => record.get("allfields"));
    return properties;
  } catch (e) {
    return null;
  }
};
