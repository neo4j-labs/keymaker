CREATE CONSTRAINT FOR ( n:Engine ) REQUIRE (n.id) IS NODE KEY;
CREATE CONSTRAINT FOR ( n:DBConnection ) REQUIRE (n.id) IS NODE KEY;
CREATE CONSTRAINT FOR (n:SecurityOrganization) REQUIRE n.name IS UNIQUE;
CREATE CONSTRAINT FOR (n:EmailDomain) REQUIRE n.name IS UNIQUE;
CREATE CONSTRAINT FOR (n:SoftwareEdition) REQUIRE n.name IS UNIQUE;
CREATE CONSTRAINT FOR (n:Phase) REQUIRE (n.id) IS NODE KEY;
CREATE CONSTRAINT FOR (n:APIKey) REQUIRE (n.id) IS NODE KEY;
CREATE CONSTRAINT FOR (n:User) REQUIRE (n.email) IS NODE KEY;