import { runQuery, CYPHER_WORKBENCH_DRIVER } from "../util/db";

export const allDataModelsForUser = async (dataModelKey, context) => {
  try {
    const query = `
      MATCH (d:DataModel), (u:User {email: $email})
      WHERE EXISTS((u)<-[:OWNER|MEMBER|VIEWER|KM_OWNER|KM_MEMBER|KM_VIEWER]-(d)) 
        OR d.isPrivate<>true 
        OR u:Admin
        OR d.key = $dataModelKey
      MATCH (m)<-[:HAS_METADATA]-(d)-[:HAS_NODE_LABEL]->(n)
      WHERE u.primaryOrganization IN labels(d) AND user.primaryOrganization IN labels(m)
      RETURN {id: d.key, name: m.title, labels: collect(n.label)} AS dataModel
    `;
    const result = await runQuery({
      query,
      isRead: true,
      args: {
        email: context.email,
        dataModelKey: dataModelKey,
      },
      driver: CYPHER_WORKBENCH_DRIVER,
      database: process.env.CW_NEO4J_DATABASE,
    });
    const dataModels = result.records.map((record) => record.get("dataModel"));
    return dataModels;
  } catch (err) {
    return [];
  }
};

export const updateCWPermissions = async (args, context) => {
  let { key, userRoles, nodeLabel } = args.input;
  const query = `
      // Update data model (or cypher builder)
      WITH $key as key, $userRoles as userRoles, $userEmail as userEmail
      MATCH (userDoingAction:User {email: userEmail})
      MATCH (itemToSecure:${nodeLabel} {key: key})
      CALL apoc.util.validate(NOT userDoingAction.primaryOrganization IN labels(itemToSecure), "permission denied (wrong org)",[0])
      CALL apoc.util.validate(NOT(EXISTS((userDoingAction)<-[:OWNER|KM_OWNER]-(itemToSecure))
                                  OR userDoingAction:Admin),"permission denied", [0])
      WITH itemToSecure, userRoles, userDoingAction
      // find existing relationships
      OPTIONAL MATCH (itemToSecure)-[kmRel:KM_OWNER|KM_VIEWER|KM_MEMBER]->(u:User)
      WITH itemToSecure, userRoles, userDoingAction, u, collect(type(kmRel)) as kmRels
      WITH itemToSecure, userRoles, userDoingAction,
        apoc.map.fromLists([x in userRoles | x.email], [x in userRoles | x.roles]) as kmNewUserRoleMap,
        CASE WHEN size(kmRels) > 0
          THEN apoc.map.fromLists(collect(u.email), collect(kmRels))
          ELSE {}
        END as kmExistingUserRoleMap
      WITH itemToSecure, userDoingAction, kmNewUserRoleMap, kmExistingUserRoleMap,
      // figure out emails to add or update
      [email IN keys(kmNewUserRoleMap)
        WHERE NOT email IN keys(kmExistingUserRoleMap)
          OR NOT apoc.coll.containsAll(coalesce(kmExistingUserRoleMap[email],[]), kmNewUserRoleMap[email])
        | email] as emailsToAddOrUpdate,
      // figure out emails to remove
      [email IN keys(kmExistingUserRoleMap)
        WHERE NOT email IN keys(kmNewUserRoleMap)
        | email] as emailsToRemove
      // add missing relationships
      UNWIND emailsToAddOrUpdate as emailToAddOrUpdate
      MATCH (user:User {email: emailToAddOrUpdate})
        WHERE userDoingAction.primaryOrganization IN labels(user)
        // delete existing relationships first
      OPTIONAL MATCH (itemToSecure)-[existingRole:KM_OWNER|KM_VIEWER|KM_MEMBER]->(user)
      DELETE existingRole
      WITH itemToSecure, user, userDoingAction, kmNewUserRoleMap, kmExistingUserRoleMap,
        emailsToRemove, emailToAddOrUpdate,
        kmNewUserRoleMap[emailToAddOrUpdate] as newOrUpdatedRoles, collect(existingRole) as _
      // now add the relationships
      UNWIND newOrUpdatedRoles as newOrUpdatedRole
      WITH itemToSecure, user, userDoingAction, kmNewUserRoleMap, kmExistingUserRoleMap, emailsToRemove, emailToAddOrUpdate, newOrUpdatedRole,
        replace('MERGE (itemToSecure)-[:KM_$$role]->(user) RETURN "Merged" as action', '$$role', newOrUpdatedRole) as cypher
      CALL apoc.cypher.doIt(cypher, {itemToSecure:itemToSecure, user:user}) YIELD value
      WITH itemToSecure, user, userDoingAction, kmNewUserRoleMap, kmExistingUserRoleMap, emailsToRemove, collect(newOrUpdatedRole) as _
      WITH itemToSecure, userDoingAction, kmNewUserRoleMap, kmExistingUserRoleMap, emailsToRemove, collect(user) as _
      // delete unneeded relationships
      CALL apoc.do.when(size(emailsToRemove) > 0,
        'UNWIND emailsToRemove as emailToRemove
        MATCH (user:User {email: emailToRemove})
        WHERE userDoingAction.primaryOrganization IN labels(user)
        OPTIONAL MATCH (itemToSecure)-[existingRole:KM_OWNER|KM_VIEWER|KM_MEMBER]->(user)
        DELETE existingRole
        WITH itemToSecure, userDoingAction, emailToRemove, collect(existingRole) as _
        WITH itemToSecure, userDoingAction, collect(emailToRemove) as _
        RETURN true as result',
        'RETURN true as result', { emailsToRemove: emailsToRemove, itemToSecure: itemToSecure, userDoingAction: userDoingAction }
      ) YIELD value
      RETURN value AS success
  `;
  await runQuery({
    query,
    args: {
      key: key,
      userEmail: context.email,
      userRoles: [{ email: context.email, roles: userRoles }],
    },
    driver: CYPHER_WORKBENCH_DRIVER,
    database: process.env.CW_NEO4J_DATABASE,
  });
  return true;
};
