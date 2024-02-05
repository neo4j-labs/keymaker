# Keymaker Engine API

The GraphQL and cypher code for executing cypher query pipelines and exposing the results through the GraphQL endpoint

## Install Dependencies

### Install dependencies:

Run:

```
npm install
```

### Configure the .env file

Create a `.env` file by copying the `.env.example` file to .env. For the Neo4j database you created, set your Neo4j connection string and credentials in .env. For example:

.env

```
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password
NEO4J_DATABASE=neo4j
```

## Start the API

Start the service:

```
npm start
```

This will start the Engine API GraphQL service on localhost:4001 if the environment variables are kept the same.

For more instructions see the README file in the parent directory.