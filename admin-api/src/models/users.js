import { encrypt, decrypt } from "../util/encryption/crypto";
import {
  isEnterpriseLicense,
  isEnterpriseTrialLicense,
  getLicenseTypeAndExpiration as getLicenseTypeAndExpirationInternal,
  isLabsLicense
} from "../util/license/license";
import { runQuery, getDriver } from "../util/db";
import { logger } from "../index";
import { v4 as uuidv4 } from 'uuid';

export const createUser = async (context) => {
  const transactionId = uuidv4();  
  const apiCallName = "createUser";
  try {
    const query = `
      WITH  {
        neoDomains: ['neo4j.com','neo4j.org','neotechnology.com'],
        neoOrg: 'Neo4j'
      } as params
      OPTIONAL MATCH (u:User {email:$email})
      CALL apoc.do.when(u IS NULL, "
        WITH params, split($email, '@')[1] as emailDomain,email,picture, name        
        CALL apoc.util.validate(NOT emailDomain IN params.neoDomains,
          'No valid organization for user',[0]
        )
        WITH params,picture, name,email  
        MATCH (org:SecurityOrganization {name: params.neoOrg})
        MERGE (u:User {email: email})
        SET u.primaryOrganization = org.name
        WITH *
        CALL apoc.create.addLabels([u], [org.name]) YIELD node
        WITH u, org, picture, name,email
        MERGE (u)-[:MEMBER]->(org)
        SET u.picture = picture, u.name = name
        RETURN u",
        "
        CALL apoc.util.validate(
          NOT (EXISTS(
                (existingUser)-[:MEMBER]->(:SecurityOrganization)
              )),
            'No valid organization for user',[0]
        )                
        WITH existingUser,params, picture, name
        MATCH (existingUser)-[:MEMBER]->(org:SecurityOrganization)                
        WHERE existingUser.primaryOrganization = org.name
        SET existingUser.picture = picture, existingUser.name = name
        RETURN existingUser as u",
        {existingUser: u,email:$email, params: params, picture: $picture, name: $name}
      ) YIELD value
      RETURN value.u as u
  `;
  logger.info(`Transaction ID: ${transactionId} -  API: ${apiCallName} - Requesting user creation for ${context.email}`);
  const result = await runQuery({
    query,
    args: {
      email: context.email,
      name: context.name ? context.name : "",
      picture: context.picture ? context.picture : "",
    },
    driver: getDriver(),
    database: process.env.NEO4J_DATABASE,
  });
  const createdUser = result.records[0].get("u").properties;
  logger.info(`Transaction ID: ${transactionId} -  API: ${apiCallName} - User Node created for ${context.email}`);
  return createdUser;
  } catch(error) {
    logger.error(`Transaction ID: ${transactionId} -  API: ${apiCallName} - Failed to create User for ${context.email}: ${error.message}`);
    throw error;
  } 
};

export const loginUser = async ({ email, password }) => {
  const transactionId = uuidv4();  
  const apiCallName = "loginUser";
  try {
    const query = `
    MATCH (u:User)
    WHERE u.email=$email
    RETURN u
  `;
  logger.info(`Transaction ID: ${transactionId} -  API: ${apiCallName} - User ${email} is attempting to Login`);
  const result = await runQuery({
    query,
    driver: getDriver(),
    args: { email, password },
    database: process.env.NEO4J_DATABASE,
  });
  if (password === decrypt(result.records[0].get("u").properties.password)) {
    logger.info(`Transaction ID: ${transactionId} -  API: ${apiCallName} - User ${email} Logged in successfully`);
    return result.records[0].get("u").properties;
  }
  else { 
    logger.error(`Transaction ID: ${transactionId} -  API: ${apiCallName} - Login Failed for User ${email}: User credentials are incorrect`);
    return null;
  }
   } catch(error) {
    logger.error(`Transaction ID: ${transactionId} -  API: ${apiCallName} - Login Failed For User ${email}: ${error.message}`);
    throw error;
  }
};

export const createUserSignUp = async ({ email, password, name, picture }) => {
  const transactionId = uuidv4();  
  const apiCallName = "createUserSignUp";
  try {
  const pass = encrypt(password);
  const query = `
    MERGE (u:User{email:$email})
    SET u.primaryOrganization="Neo4j"
    SET u.password=$pass
    SET u.name=$name
    SET u.picture=$picture
    SET u:Neo4j
    SET u:Admin
    WITH u
    MATCH (so:SecurityOrganization {name: "Neo4j"})
    MERGE (u)-[:MEMBER]->(so)
    MERGE (us:UserSettings {email : $email})
    SET us:Neo4j
    MERGE (u)-[:HAS_USER_SETTINGS]->(us)
    RETURN u
  `;
  logger.info(`Transaction ID: ${transactionId} -  API: ${apiCallName} - Requesting user registration for ${email}`);
  const result = await runQuery({
    query,
    driver: getDriver(),
    args: { email, pass, name, picture },
    database: process.env.NEO4J_DATABASE,
  });
  const createdUserRegistration = result.records[0].get("u").properties;
  logger.info(`Transaction ID: ${transactionId} -  API: ${apiCallName} - User registration successful for ${email}`);
  return createdUserRegistration;
  } catch(error) {
    logger.error(`Transaction ID: ${transactionId} -  API: ${apiCallName} - Failed to register User for ${email}: ${error.message}`);
    throw error;
  }
};

export const getCurrentUser = async ({ email }) => {
  const query = `
    MATCH (u:User {email: $email})
    RETURN u AS user
  `;
  const result = await runQuery({
    query,
    args: { email },
    driver: getDriver(),
    database: process.env.NEO4J_DATABASE,
  });
  return result.records[0].get("user").properties;
};

export const searchUserByEmail = async (email, context) => {
  const query = `
    MATCH (u1:User {email: $eid})
    MATCH (u2:User)
    WHERE apoc.text.clean(u2.email) contains apoc.text.clean($email) AND u2.primaryOrganization = u1.primaryOrganization
    AND u2.email <> $eid
    RETURN u2
  `;
  const result = await runQuery({
    query,
    driver: getDriver(),
    args: { email, eid: context.email },
    database: process.env.NEO4J_DATABASE,
  });
  return result.records.map((record) => record.get("u2").properties);
};

export const getUserRolesForNode = async ({ id }, context, node) => {
  const query = `
    MATCH (n {id: $id})
    MATCH (u1:User {email: $email})
    WHERE u1.primaryOrganization IS NOT NULL AND u1.primaryOrganization IN labels(n)
    //CALL apoc.util.validate(NOT(exists(u.primaryOrganization)), 'The calling User is not configured correctly', [0])
    CALL apoc.util.validate(u1.primaryOrganization IS NULL, 'The calling User is not configured correctly', [0]) 
    CALL apoc.util.validate(NOT (EXISTS ((u1)<-[:OWNER|MEMBER|VIEWER]-(n)) OR u1:Admin OR n.isPrivate<>true),"permission denied",[0])
    MATCH (u2:User)<-[rel:OWNER|MEMBER|VIEWER]-(n)
    WHERE u2.primaryOrganization IS NOT NULL AND u2.primaryOrganization IN labels(n)
    RETURN {user: {name: u2.name, email: u2.email, picture: u2.picture}, role: type(rel)} AS userRole
  `;
  const result = await runQuery({
    query,
    driver: getDriver(),
    database: process.env.NEO4J_DATABASE,
    args: { id, email: context.email, node },
  });
  return result.records.map((record) => record.get("userRole"));
};

export const addUserRoleToNode = async ({ email, role, id }, context, node) => {
  const transactionId = uuidv4();  
  const apiCallName = "addUserRoleToNode";
  try {
    const query = `
    MATCH (n:${node} {id: $id})
    MATCH (u1:User {email: $eid})
    MATCH (u2:User {email: $email})
    WHERE u1.primaryOrganization IS NOT NULL AND u1.primaryOrganization IN labels(n) AND u2.primaryOrganization IS NOT NULL AND u2.primaryOrganization IN labels(n)
    //CALL apoc.util.validate(NOT(exists(u1.primaryOrganization)), 'The calling User is not configured correctly', [0]) 
    CALL apoc.util.validate(u1.primaryOrganization IS NULL, 'The calling User is not configured correctly', [0])

    //CALL apoc.util.validate(NOT(exists(u2.primaryOrganization)), 'The calling User is not configured correctly', [0]) 
    CALL apoc.util.validate(u2.primaryOrganization IS NULL, 'The calling User is not configured correctly', [0])

    CALL apoc.util.validate( NOT(EXISTS((u1)<-[:OWNER]-(n)) OR u1:Admin  
    AND NOT EXISTS((u2)<-[:OWNER|MEMBER|VIEWER]-(n))),"permission denied",[0])
    MERGE (u2)<-[:${role}]-(n)
    RETURN {user: {name: u2.name, email: u2.email, picture: u2.picture}, role: $role} AS userRole
  `;
  logger.info(`Transaction ID: ${transactionId} -  API: ${apiCallName} - Request to assign role ${role} to user ${email} for node ${node} (ID: ${id})`);
  const result = await runQuery({
    query,
    driver: getDriver(),
    database: process.env.NEO4J_DATABASE,
    args: { email, role, id, eid: context.email, node },
  });
  const createdUserRole = result.records[0].get("userRole");
  logger.info(`Transaction ID: ${transactionId} -  API: ${apiCallName} -  User ${email} assigned role ${role} for node ${node} (ID: ${id})`);
  return createdUserRole;
  } catch(error) {
    logger.error(`Transaction ID: ${transactionId} -  API: ${apiCallName} - Failed to assign User ${email} role for node ${node} (ID: ${id}): ${error.message}`);
    throw error;
  } 
};

export const editUserRoleOnNode = async (
  { email, role, id },
  context,
  node
) => {
  const transactionId = uuidv4();  
  const apiCallName = "editUserRoleOnNode";
  try {
    const query = `
    MATCH (n:${node} {id: $id})
    MATCH (u1:User {email: $eid})
    MATCH (u2:User {email: $email})
    WHERE u1.primaryOrganization IS NOT NULL AND u1.primaryOrganization IN labels(n) AND u2.primaryOrganization IS NOT NULL AND u2.primaryOrganization IN labels(n)
    //CALL apoc.util.validate(NOT(exists(u1.primaryOrganization)), 'The calling User is not configured correctly', [0]) 
    CALL apoc.util.validate(u1.primaryOrganization IS NULL, 'The calling User is not configured correctly', [0])

    //CALL apoc.util.validate(NOT(exists(u2.primaryOrganization)), 'The calling User is not configured correctly', [0]) 
    CALL apoc.util.validate(u2.primaryOrganization IS NULL, 'The calling User is not configured correctly', [0])
    CALL apoc.util.validate( NOT(EXISTS((u1)<-[:OWNER]-(n)) OR u1:Admin AND u1.email<>u2.email),"permission denied",[0])
    MATCH (u2)<-[r:OWNER|MEMBER|VIEWER]-(n)
    DETACH DELETE r
    WITH u2, n
    MERGE (u2)<-[:${role}]-(n)
    RETURN {user: {name: u2.name, email: u2.email, picture: u2.picture}, role: $role} AS userRole
  `;
  logger.info(`Transaction ID: ${transactionId} -  API: ${apiCallName} - Request to edit role ${role} for user ${email} having ${node} (ID: ${id})`);
  const result = await runQuery({
    query,
    driver: getDriver(),
    database: process.env.NEO4J_DATABASE,
    args: { email, role, id, eid: context.email, node },
  });
  const editedUserRole = result.records[0].get("userRole");
  logger.info(`Transaction ID: ${transactionId} -  API: ${apiCallName} -  Updated user role ${role} for User ${email}  for node ${node} (ID: ${id})`);
  return editedUserRole;
  } catch(error) {
    logger.error(`Transaction ID: ${transactionId} -  API: ${apiCallName} - Failed to edit User role for User ${email} for node ${node} (ID: ${id}): ${error.message}`);
    throw error;
  }  
};

export const removeUserRoleFromNode = async (
  { email, role, id },
  context,
  node
) => {
  const transactionId = uuidv4();  
  const apiCallName = "removeUserRoleFromNode";
  try {
    const query = `
    MATCH (n:${node} {id: $id})
    MATCH (u1:User {email: $eid})
    MATCH (u2:User {email: $email})
    WHERE u1.primaryOrganization IS NOT NULL AND u1.primaryOrganization IN labels(n) AND u2.primaryOrganization IS NOT NULL AND u2.primaryOrganization IN labels(n)
    //CALL apoc.util.validate(NOT(exists(u1.primaryOrganization)), 'The calling User is not configured correctly', [0]) 
    CALL apoc.util.validate(u1.primaryOrganization IS NULL, 'The calling User is not configured correctly', [0])

    //CALL apoc.util.validate(NOT(exists(u2.primaryOrganization)), 'The calling User is not configured correctly', [0]) 
    CALL apoc.util.validate(u2.primaryOrganization IS NULL, 'The calling User is not configured correctly', [0]) 
    CALL apoc.util.validate( NOT(EXISTS((n)-[:OWNER]->(u1)) OR u1:Admin AND u1.email<>u2.email),"permission denied",[0])
    MATCH (n)-[r:OWNER|MEMBER|VIEWER]->(u2)
    DELETE r
    RETURN {user: {name: u2.name, email: u2.email, picture: u2.picture}, role: $role} AS userRole
  `;
  logger.info(`Transaction ID: ${transactionId} -  API: ${apiCallName} - Request to remove role ${role} for user ${email} having ${node} (ID: ${id})`);
  const result = await runQuery({
    query,
    driver: getDriver(),
    database: process.env.NEO4J_DATABASE,
    args: { email, role, id, eid: context.email, node },
  });
  const deletedUserRole = result.records[0].get("userRole");
  logger.info(`Transaction ID: ${transactionId} -  API: ${apiCallName} -  Removed user role ${role} for User ${email} for node ${node} (ID: ${id})`);
  return deletedUserRole
  } catch(error) {
    logger.error(`Transaction ID: ${transactionId} -  API: ${apiCallName} - Failed to remove user role ${role} for User ${email} for node ${node} (ID: ${id}): ${error.message}`);
    throw error;
  } 
};

export const leaveNode = async ({ email, role, id }, context, node) => {
  const query = `
    MATCH (n:${node} {id: $id})
    MATCH (u1:User {email: $eid})
    MATCH (u2:User {email: $email})
    WHERE u1.primaryOrganization IS NOT NULL AND u1.primaryOrganization IN labels(n) AND u2.primaryOrganization IS NOT NULL AND u2.primaryOrganization IN labels(n)
    //CALL apoc.util.validate(NOT(exists(u1.primaryOrganization)), 'The calling User is not configured correctly', [0]) 
    CALL apoc.util.validate(u1.primaryOrganization IS NULL, 'The calling User is not configured correctly', [0])

    //CALL apoc.util.validate(NOT(exists(u2.primaryOrganization)), 'The calling User is not configured correctly', [0]) 
    CALL apoc.util.validate(u2.primaryOrganization IS NULL, 'The calling User is not configured correctly', [0])
    MATCH (n)-[r:OWNER]->()
    WITH u1, u2, n, count(r) AS numOwners
    CALL apoc.util.validate(NOT ((u1.email = u2.email) AND (EXISTS((n)-[:MEMBER|VIEWER]->(u2))
    OR (EXISTS((n)-[:OWNER]->(u2)) AND numOwners>1))),"add another owner",[0])
    MATCH (n)-[r:OWNER|MEMBER|VIEWER]->(u2)
    DELETE r
    RETURN {user: {name: u2.name, email: u2.email, picture: u2.picture}, role: $role} AS userRole
  `;
  const result = await runQuery({
    query,
    driver: getDriver(),
    database: process.env.NEO4J_DATABASE,
    args: { email, role, id, eid: context.email, node },
  });
  return result.records[0].get("userRole");
};

export const isAdmin = async (email) => {
  const query = `
    MATCH (u:User {email: $email})
    RETURN u:Admin AS isAdmin
  `;
  const result = await runQuery({
    query,
    args: { email },
    driver: getDriver(),
    database: process.env.NEO4J_DATABASE,
  });
  return result.records[0].get("isAdmin");
};

export const isCurrentUser = async (email, context) => {
  return email === context.email;
};

export const getLicenseTypeAndExpiration = async () => {
  return getLicenseTypeAndExpirationInternal();
};

export const checkLicense = async () => {
  if (isEnterpriseLicense()) {
    return "Enterprise";
  } else if (isEnterpriseTrialLicense()) {
    return "EnterpriseTrial";
  } else {
    return "Basic";
  }
};

export const acceptedEula = async (email) => {
  const transactionId = uuidv4();  
  const apiCallName = "acceptedEula";
  try { 
    let query = "";
  if (isEnterpriseLicense() || isEnterpriseTrialLicense()) {
    query = `
      OPTIONAL MATCH (u:User { email: $email})
      RETURN
      CASE 
      WHEN u.acceptedEula=true 
      THEN "true"
      ELSE "false" END AS acceptedEula
    `;
  } else if ( isLabsLicense()) {
    query = `
      OPTIONAL MATCH (u:User { email: $email})
      RETURN "true" AS acceptedEula
    `;
  } else {
    query = `
      MATCH (u:User)
      RETURN
      CASE 
      WHEN u.acceptedEula=true AND u.email=$email
      THEN "true"
      WHEN u.acceptedEula=true AND u.email<>$email
      THEN "incorrectEmail"
      ELSE "false" END AS acceptedEula
    `;
  }

  const result = await runQuery({
    query,
    args: { email },
    driver: getDriver(),
    database: process.env.NEO4J_DATABASE,
  });
  const userHasAcceptedEula = result.records[0].get("acceptedEula");
  if (userHasAcceptedEula) {
    return userHasAcceptedEula;
  } else {
    logger.error(`Transaction ID: ${transactionId} -  API: ${apiCallName} - Login Failed for User ${email}: Issue with Eula or Keymaker license`);
  }
  } catch(error) {
    logger.error(`Transaction ID: ${transactionId} -  API: ${apiCallName} - Login Failed for User ${email}: ${error.message}`);
    throw error;
  } 
};

export const logInLocalUser = async (email) => {
    const query = `
    MATCH (u:User)
    SET u.email=$email
    SET u.acceptedEula = true
    RETURN u AS localUser
  `;
  const result = await runQuery({
    query,
    args: { email },
    driver: getDriver(),
    database: process.env.NEO4J_DATABASE,
  });
  return result.records[0].get("localUser").properties;
};

export const setEulaEnterprise = async (email) => {
  const query = `
    MATCH (u:User{email:$email})
    SET u.acceptedEula = true
    RETURN u AS localUser
  `;
  const result = await runQuery({
    query,
    args: { email },
    driver: getDriver(),
    database: process.env.NEO4J_DATABASE,
  });
  return result.records[0].get("localUser").properties;
};
