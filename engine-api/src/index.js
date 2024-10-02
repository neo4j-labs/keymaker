import "./env";
import fs from "fs";
import http from "http";
import path from "path";
import https from "https";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import {
  isLicenseValid,
  getLicenseInfo,
  getLicenseError,
  monitorLicenseExpiration,
} from "./util/license";
import { validateAPIKey } from "./util/keys";
import { Neo4jGraphQL } from "@neo4j/graphql";
import neo4j from "neo4j-driver";
import { mergeTypeDefs, mergeResolvers } from '@graphql-tools/merge'
import { loadFilesSync } from '@graphql-tools/load-files'
import { runQuery, setDriver, getDriver } from './util/db';
import winston from "winston";
import { format } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";

// Set up the logger
const logDir = process.env.LOGS_DIR || './../logs'
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',  // Log level
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    format.printf(info => `${info.timestamp} [${info.level.toUpperCase()}]: ${info.message}`)
  ),
  transports: [
    new winston.transports.DailyRotateFile({
      filename: `${logDir}/keymaker.log`, // Log file path
      datePattern: 'YYYY-MM-DD',     // Daily log rotation
      maxSize: process.env.LOG_MAX_SIZE || '20m',                // Max file size (e.g., 20MB)
      maxFiles: process.env.LOG_RETENTION_PERIOD || '14d',               // Retention period (e.g., 14 days)
    }),
    new winston.transports.Console({  // Also log to console
      format: winston.format.simple(),
    }),
  ],
});

const HOST_NAME = process.env.HOST_NAME || null;
const HOST_PROTOCOL = process.env.HOST_PROTOCOL || "http";
const GRAPHQL_LISTEN_PORT = process.env.GRAPHQL_LISTEN_PORT || "4001";
const PLAYGROUND_ENABLED = process.env.PLAYGROUND_ENABLED || "true";
const INTROSPECTION_ENABLED = process.env.PLAYGROUND_ENABLED || "true";
const WHITELISTED_ORIGINS_FILE =
  process.env.WHITELISTED_ORIGINS_FILE || "./whitelisted-origins.txt";

const startApolloServer = async () => {
  /* check license validity before starting the process */
  if (!isLicenseValid()) {
    console.log("Error validating license: ", getLicenseError());
    process.exit(1);
  } else {
    var licenseObj = getLicenseInfo();
    console.log(
      `License Info: ${licenseObj.licensed_product} ${licenseObj.license_version} - ${licenseObj.license_type}`
    );
    monitorLicenseExpiration(true);
  }

  var driverConfig = {
    // userAgent: `neo4j-solutions-workbench-api/v${VERSION}`
    disableLosslessIntegers: true,
    maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
    maxConnectionPoolSize: 5000,
    connectionAcquisitionTimeout: 2 * 60 * 1000 // 120 seconds
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

  /* initialize Apollo server */
  neo4jGraphQL.getSchema().then(async (schema) => {
    var apollo = new ApolloServer({
      schema: schema,
      introspection: (process.env.INTROSPECTION_ENABLED === 'true'),
      playground: (process.env.PLAYGROUND_ENABLED === 'true'),
      cors: true,
      context: async ({ req }) => {
        try {
          // check if origin is whitelisted
          const path = WHITELISTED_ORIGINS_FILE;
          if (fs.existsSync(path)) {
            const origins = fs.readFileSync(path, "utf8").split("\n");
            if (origins.includes(req.headers.origin)) return;
          }
          // if the origin is not whitelisted validate API key
          const securityOrg = await validateAPIKey(req.headers["api-key"]);
          return { securityOrg };
        } catch (err) {
          throw err;
        }
      },
    });

    /* start Apollo  server*/
    await apollo.start();

    /* apply express middleware */
    const app = express();
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
      console.log(`unknown HOST_PROTOCOL: ${HOST_PROTOCOL}`);
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

// testDbConnection();