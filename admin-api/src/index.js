import "./env";
import path from "path";
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import http from "http";
import fs from "fs";
import https from "https";
import {
  isLicenseValid,
  getLicenseInfo,
  getLicenseError,
  monitorLicenseExpiration,
} from "./util/license/license";
import { Neo4jGraphQL } from "@neo4j/graphql";
import neo4j from "neo4j-driver";
import { mergeTypeDefs, mergeResolvers } from '@graphql-tools/merge'
import { loadFilesSync } from '@graphql-tools/load-files'
import { runQuery, setDriver, getDriver } from './util/db';

const HOST_NAME = process.env.HOST_NAME || null;
const HOST_PROTOCOL = process.env.HOST_PROTOCOL || "http";
const GRAPHQL_LISTEN_PORT = process.env.GRAPHQL_LISTEN_PORT || "4000";
const PLAYGROUND_ENABLED = process.env.PLAYGROUND_ENABLED || "true";
const INTROSPECTION_ENABLED = process.env.PLAYGROUND_ENABLED || "true";

const startApolloServer = async () => {
  /* check license validity before starting the process */
  if (!isLicenseValid()) {
    console.log("Error validating license: ", getLicenseError());
    process.exit(1);
  } else {
    var licenseObj = getLicenseInfo();
    const licenseText = `License Info: ${licenseObj.licensed_product} ${licenseObj.license_version} - ${licenseObj.license_type}`;
    console.log(licenseText);
    monitorLicenseExpiration(true);
  }

  var driverConfig = {
    // userAgent: `neo4j-solutions-workbench-api/v${VERSION}`
  };
  
  const uri = process.env.NEO4J_URI || "bolt://localhost:7687";
  const user = process.env.NEO4J_USER || "neo4j";
  const pass = process.env.NEO4J_PASSWORD || "password";
  
  if (!process.env.NEO4J_URI.match(/bolt\+s/) && !process.env.NEO4J_URI.match(/neo4j\+s/)) {
    driverConfig.encrypted = (process.env.NEO4J_ENCRYPTED === "true") ? true : false;
  }
  //console.log(uri, user, pass, driverConfig);
  const driver = neo4j.driver(
    uri,
    neo4j.auth.basic(user, pass),
    driverConfig
  );
  setDriver(driver);
  
  const mergeTypes = (types, options) => {
    const schemaDefinition = options && typeof options.schemaDefinition === 'boolean' ? options.schemaDefinition : true
  
    return mergeTypeDefs(types, {
      useSchemaDefinition: schemaDefinition,
      forceSchemaDefinition: schemaDefinition,
      throwOnConflict: true,
      commentDescriptions: true,
      reverseDirectives: true,
      ...options
    })
  }
  
  const typeDefs = mergeTypes(
    loadFilesSync(path.join(__dirname, "./**/types/*.js"))
  );
  
  const resolvers = mergeResolvers(
    loadFilesSync(path.join(__dirname, "./**/resolvers/*.js"))
  );
  
  const neo4jGraphQL = new Neo4jGraphQL({ 
    typeDefs, 
    resolvers,
    driver 
  });

  /* token verification functions */
  const client = jwksClient({
    jwksUri: process.env.JWKS_URI,
  });

  const options = {
    algorithms: ["RS256"],
    issuer: process.env.ISSUER,
    audience: process.env.CLIENT_ID,
  };

  function getKey(header, cb) {
    client.getSigningKey(header.kid, function (err, key) {
      if (key) {
        var signingKey = key.publicKey || key.rsaPublicKey;
        cb(null, signingKey);
      }
    });
  }

  const verifyToken = async (id_token) => {
    return new Promise((resolve) => {
      jwt.verify(id_token, getKey, options, (err, decoded) => {
        if (err) {
          return new Error("invalid token");
        }
        resolve(decoded);
      });
    });
  };

  const stripToken = (token) => {
    if (token) {
      const id_token = token.replace("Bearer ", "");
      return id_token;
    } else {
      return new Error("invalid token");
    }
  };

  const isLicenseTypeQuery = (query) => {
    query = query || '';
    let pattern = /licenseInfo: getLicenseTypeAndExpiration/
    return pattern.test(query);
  }

  /* initialize Apollo server */
  neo4jGraphQL.getSchema().then(async (schema) => {
    var apollo = new ApolloServer({
      schema: schema,
      introspection: (process.env.INTROSPECTION_ENABLED === 'true'),
      playground: (process.env.PLAYGROUND_ENABLED === 'true'),
      cors: true,
      context: async ({ req }) => {
        const token = req.headers.authorization;
        try {
          if (process.env.AUTH_METHOD == "auth0") {
            const id_token = stripToken(token);
            if (id_token === 'admin' && isLicenseTypeQuery(req.body.query)) {
              return { name: 'admin', email: 'admin@keymaker.local', picture: ''}
            } else {
              const profile = await verifyToken(id_token);
            
              const { email, picture, name } = profile;
              return { name, email, picture };
            }
          } else if (process.env.AUTH_METHOD == "local") {
            const email = stripToken(token);
            return { email };
          } else {
            return {};
          }
        } catch (err) {
          console.log(err);
        }
      },
    });

    /* start Apollo  server*/
    await apollo.start();

    /* apply express middleware */
    var app = express();
    apollo.applyMiddleware({ app });

    /* set protocol */
    var server;
    var protocolOk = true;
    if (HOST_PROTOCOL === "http") {
      server = http.createServer(app);
    } else if (HOST_PROTOCOL === "https") {
      const credentials = {
        key: fs.readFileSync(
          `${process.env.CERTIFICATE_DIR}/${process.env.CERTIFICATE_KEY}`
        ),
        cert: fs.readFileSync(
          `${process.env.CERTIFICATE_DIR}/${process.env.CERTIFICATE_CRT}`
        ),
      };
      server = https.createServer(credentials, app);
    } else {
      console.log(`unknown HOST_PROTOCOL ${HOST_PROTOCOL}`);
      var protocolOk = false;
    }

    /* start server */
    if (protocolOk) {
      server.listen({ port: GRAPHQL_LISTEN_PORT }, () => {
        if (HOST_NAME) {
          console.log(
            "🚀 Server ready at",
            `${HOST_PROTOCOL}://${HOST_NAME}:${GRAPHQL_LISTEN_PORT}${apollo.graphqlPath}`
          );
        } else {
          console.log("🚀 Server ready!");
        }
      });
    }
  });  
}

startApolloServer();

const testDbConnection = async function () {
  var query = "MATCH (n) RETURN count(n) as numNodes"
  try {
      var result = await runQuery({
        query,
        driver: getDriver(),
        // args: { email: context.email },
        database: process.env.NEO4J_DATABASE,
      });
      console.log("testDbConnection num nodes: " + result.records[0].get("numNodes"));
  } catch (error) {
      console.log("testDbConnection error connecting to database");
      console.log(error);
  }
}