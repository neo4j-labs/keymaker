MERGE (s:SecurityOrganization {name:'Neo4j'})
SET s.type = 'organization'

MERGE (neo1:EmailDomain {name:'neotechnology.com'})
MERGE (neo2:EmailDomain {name:'neo4j.com'})
MERGE (neo3:EmailDomain {name:'neo4j.org'})
MERGE (neo1)-[:BELONGS_TO]->(s)
MERGE (neo2)-[:BELONGS_TO]->(s)
MERGE (neo3)-[:BELONGS_TO]->(s);

WITH {
  Basic: "Basic",
  Premium: "Premium",
  Enterprise: "Enterprise",
  EnterpriseTrial: "EnterpriseTrial",
  Labs: "Labs"
} as softwareEditions

UNWIND keys(softwareEditions) as softwareEditionName
MERGE (softwareEdition:SoftwareEdition {name:softwareEditionName});

// Consider increasing the duration to 75 years 
//This will create an api-key - LZmIbId7He4dh0hH7ZUVKz5A 
//This api-key will be needed to run engine-api graphql queries

CREATE (key:APIKey {id: apoc.create.uuid(), key: "U2FsdGVkX1/uBrrShAYoxyP3RqZAqIHeWK3O+39vJofCg0fEwoOUWUFDgfyt+BrZ"})
SET key:Neo4j
SET key.expirationDate = date() + Duration({days: 365})
RETURN key;
