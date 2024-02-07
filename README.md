# Keymaker

## Overview

Keymaker is an analytics framework built on top of Neo4j. It allows you to write Cypher based pipleines on top of your Neo4j database without having to write any infrastructure code. For each Cypher pipleine you write, the framework exposes a graphql API endpoint which allows you to easily run the pipeline and/or consume the results from a frontend application. It also has built in collabration capabilities, performance testing features and encourages you to write more readable Cypher.

Keymaker has 3 components: the admin dashboard, admin API, and engine API. The admin dashboard and API facilitate user interaction with the framework (i.e. database connection management, engine creation, and writing Cypher). The engine API connects with your Neo4j database and exposes an endpoint which excecutes the engine.

Online help for Keymaker can be found here: https://help.neo4j.solutions/neo4j-solutions/keymaker/

## Running Keymaker

The project is divided into 4 main folders:
   
   - admin-api: This facilitate user interaction with the framework (i.e. database connection management, engine creation, and writing Cypher)
   - engine-api: This connects with your Neo4j database and exposes an endpoint which excecutes the engine
   - data: contains the initialization cypher script for running keymaker and also, the engine import json and the api graphql queries
   - ui: contains the React UI

To run the code locally, you will need to do 3 things:

   - Setup a Neo4j database
   - Build and configure the admin-api
   - Build and configure the engine-api
   - Build and configure the ui

### Setup a Neo4j database

You will need to setup an Aura instance or a Neo4j database to use as the backend storage for Keymaker.

  - If you are running Aura or Neo4j Community, you will use the default database neo4j.
  - If you are running Neo4j Enterprise Edition, you can:
    -  Use the default database neo4j
    - Create a new database. See this [link](https://neo4j.com/docs/operations-manual/current/database-administration/#administration-databases-create-database) for instructions on how to create a Neo4j database.
  - For Neo4j Community or Enterprise Edition, you will also need to install APOC Core. For instructions on how to do this, please follow this [link](https://neo4j.com/docs/apoc/current/installation/).
    - Aura users will already have this installed.

### Cypher initialization scripts

Within the folder `data/cypher` you will find a few Cypher scripts:

  - constraints_v5.cypher  
  - cypher_init_data.cypher

If you are running a version older than 5, you may have to manually adjust the syntax to match the expected syntax of your Neo4j version.

Follow these steps to run the Cypher:

  - Run either Neo4j Browser or Workspace and connect to your Neo4j database
  - Copy/paste constraints_v5.cypher into Browser/Workspace and execute it
    - If running in Browser, make sure this setting is checked: "Enable multi statement query editor"
  - Copy/paste the cypher_init_data.cypher file into Browser/Workspace and execute it

Your database is now ready to be used.

### Build and run the Admin API

Follow the instructions in the `admin-api` README file to build and run the Admin API.

### Build and run the Engine API

Follow the instructions in the `engine-api` README file to build and run the Engine API.

### Build and run the UI

Follow the instructions in the `ui` README file to build and run the UI.

### Creating Users

The create-user.sh command line utility has been provided to create users in Keymaker. You can find this script under `admin-api/scripts/create-user.sh`

If you run ./create-user.sh with no arguments, it will display a usage message:

```
Usage: ./create-user.sh <email> <password> <name> [picture] [graphql port] [https]
```

The parameters display in square brackets are optional, however, for this deployment you will need to specify the [graphql port], and since the parameters are positional, the [picture] also. The graphql port is specified in the docker-compose.yml file. The value will be the graphql port for admin-api server. 

An example command looks like:

```
./create-user.sh admin@neo4j.com password "Keymaker Admin" "" 4000
```

The response looks like:

```
Creating admin@neo4j.com
{"data":{"createUserSignUp":{"email":"admin@neo4j.com","name":"Keymaker Admin","picture":""}}}
[source]
```

Upon success, this will create a node in the database with the :User.

### Login

Assuming you installed this locally, use your web browser to navigate to http://localhost:3000/login. You will be presented with a login screen.

Enter the email and password that you created in the **Creating Users** step and hit <Enter> or click the Continue button. You should now be logged in.

## Verifying Installation

Follow these steps to create a Neo4j sandbox instance for demo datasets and to prepare for running Keymaker:

### Creating Your Own Neo4j Sandbox Instance

1. **Access Neo4j Sandbox:**
   - Navigate to [Neo4j Sandbox](https://sandbox.neo4j.com/). Sign up or log in as needed, completing any onboarding forms.

2. **Select Dataset:**
   - Opt for the Recommendations Project for a pre-built movie reviews dataset. Click **Create**.

### Sandbox Database Backups

If you want to run keymaker against the Recommendations Project beyond the 3-day sandbox expiration, you can follow the below steps to get a database dump (**Optional**)

1. **Request Backup:**
   - Within your project, find **Backups** > **Request Backup**. After processing, click **Request Download Link** to obtain the dump file.

2. **Restore Database:**
   - Use the dump file to restore the database on your local Neo4j Desktop or Aura platform. For detailed instructions, refer to [Neo4j's backup and restore guide](https://neo4j.com/docs/operations-manual/current/backup-restore/).

This setup will support the use of Keymaker with a demo dataset, facilitating the creation of sample database connections and engines.

##  Creating Database Connections and Engines

Following a successful Keymaker installation, proceed with establishing database connections and configuring query pipelines for the recommendations project.

### Database Creation Instructions

1. **Access Database Connections:**
   - Navigate to **Database Connections** and select **New Connection (+)**.

2. **Input Connection Details:**
   - **Name:** `Movies Sandbox`
   - **Connection URL:** Replace `<enter-your-connection-url>` with your specific connection URL.
   - **Private:** Choose to enable or disable based on your preference by replacing `<you-can-enable-or-disable>`.
   - **Username:** Substitute `<enter-username>` with your username.
   - **Password:** Substitute `<enter-password>` with your password.

3. **Submission and Verification:**
   - Click **Submit**, then refresh the page to view the Database Connection Card for the Movies Sandbox.

**Note:** For users of the Recommendations project on a Neo4j Sandbox, obtain your connection details (username, password, and bolt URL) from the sandbox's Connection Details section. If you see the Green check, it means that the database connection is successful. Always make sure to have apoc installed on the database connection that you are trying to create. 

### Engine Creation Instructions

To create and configure query engines, follow the general steps below for each engine type. Replace specific placeholders and values as indicated for each engine.

1. **Navigate to Engine Creation:**
   - Go to [http://localhost:3000](http://localhost:3000) and under **Engines**, select **New Engine (+)**.

2. **Enter Engine Information:**
   - **Engine Name, Description, Engine ID:** Use the specific values listed under each engine type below.
   - **Database Connection:** Select the database connection card that we created in the earlier step.
   - **Database Name:** Default, or specify the database name if using an enterprise/commercial Neo4j license.
   - **Cypher Workbench Data Model (Optional):** `None`
   - **Return Label:** `Movie`
   - **Return Properties:** `title, url, plot, movieId`

3. **Submit and Refresh:**
   - Click **Submit**, then refresh the page to view the Engine Card. Select the engine card or use the provided link to navigate directly.

4. **Import Queries:**
   - Click **Import** > **from json**.
   - Navigate to the specific path in the GitHub repo listed for each engine, copy the content, paste it, and click **Submit**.

### Specific Engine Details

**Movies - Cold Start Query Engine**
- **Engine Name:** `Movies - Cold Start`
- **Description:** `Provides recommendations without user context or preference.`
- **Engine ID:** `movies-cold-start`
- [Import Path:](http://localhost:3000/engine/movies-cold-start) `data/engineImports/movies-cold-start.json` (Creates 5 phases)

**Movies - Collaborative Query Engine**
- **Engine Name:** `Movies - Collaborative`
- **Description:** `Recommends movies based on user preference.`
- **Engine ID:** `movies-collaborative-based-recommendation`
- [Import Path:](http://localhost:3000/engine/movies-collaborative-based-recommendation) `data/engineImports/movies-collaborative-based-recommendation.json` (Creates 3 phases)

**Movies - Content Based Engine**
- **Engine Name:** `Movies - Content Based`
- **Description:** `Generates recommendations based on shared movie attributes.`
- **Engine ID:** `movies-content-based-recommendation`
- [Import Path:](http://localhost:3000/engine/movies-content-based-recommendation) `data/engineImports/movies-content-based-recommendation.json` (Creates 5 phases)

**Final Step:**
- Repeat the process for each engine type as needed. By the end, you should have one database connection for the movies sandbox and three configured query engines.

### Running Query Engines Using The Engine-API

1. **Access Apollo Sandbox:** Go to `http://localhost:4001/graphql` (or your engine-API server) and open the Apollo Sandbox by clicking on **Query your Server**.

2. **Enable Access:** If access issues arise, ensure `INTROSPECTION` and `PLAYGROUND_ENABLED` environment variables are set to `true`.

3. **Configure Request:**
   - In the **Operation** tab, prepare your GraphQL query.
   - For API key authentication, go to **Headers**, click **+ New Header**, enter `api-key` as the key and `LZmIbId7He4dh0hH7ZUVKz5A` as the value.

After setting the API key, you're ready to run your query pipelines.

#### Running Movies - Cold Start Engine 

```
query {
  recommendations(
    engineID: "movies-cold-start"
    first: 20
    skip: 0
  ) {
    item
    score
    details
  }
}
```
#### Running Movies - Collaborative Engine

```
query {
  recommendations(
    engineID: "movies-collaborative-based-recommendation",
    params: {startMovieTitle: "Shawshank Redemption, The"}
    first: 20
    skip: 0
  ) {
    item
    score
    details
  }
}
```

#### Running Movies - Movies - Content Based Engine

```
query {
  recommendations(
    engineID: "movies-content-based-recommendation",
    params: {startMovieTitle: "Tales from the Crypt Presents: Demon Knight"}
    first: 20
    skip: 0
  ) {
    item
    score
    details
  }
}
```

## Advanced topics

These sections describe further optional configuration.

### Updating the encryption key

When using the default local authentication scheme, there is a simple encryption process for encrypting a user's password. The encryption key used is set both at the UI and API layers. It is not required to modify this key, but it is recommended before creating any users. Once you have created users, do not modify it again.

admin-api/.env: ENCRYPTION_KEY=keymakerEncryptionKey

engine-api/.env: ENCRYPTION_KEY=keymakerEncryptionKey

Pick a new value, and make sure the new value is set in both files. You will need to restart the admin-api and engine-api projects if they are running.

Additionally, any user that was created before the modifying the encryption key will no longer work. You will have to re-run the created users step to fix this issue. 

