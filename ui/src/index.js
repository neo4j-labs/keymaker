import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
// import "semantic-ui-css/semantic.min.css";
import "./index.css";
import App from "./App";
import { ApolloClient, ApolloProvider, InMemoryCache, ApolloLink, HttpLink, concat, from } from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import * as serviceWorker from "./serviceWorker";
import auth from "./auth/auth";
import { getDynamicConfigValue } from './dynamicConfig';

const IS_AUTH0 = getDynamicConfigValue('REACT_APP_AUTH_METHOD') === "auth0";

const httpLink = new HttpLink({
  uri: getDynamicConfigValue('REACT_APP_GRAPHQL_URI'),
  credentials: "same-origin"
});

const authLink = new ApolloLink((operation, forward) => {
  const token = IS_AUTH0 ? auth.getIdToken() : localStorage.getItem("id_token");
  operation.setContext(({ headers }) => ({ headers: {
    authorization: token ? `Bearer ${token}` : "",
    ...headers
  }}));
  return forward(operation);
});

const client = new ApolloClient({
  cache: new InMemoryCache({
    possibleTypes: {
      Phase: ["CypherDiscoveryPhase", "CypherExcludePhase", "CypherBoostPhase", "CypherDiversityPhase"]
    }
  }),
  link: from([
    onError(({ graphQLErrors, networkError }) => {
      if (graphQLErrors) {
        graphQLErrors.map(({ message, locations, path }) =>
          console.log(
            `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
          )
        );
      }
      if (networkError) {
        console.log(`[Network error]: ${networkError}`);
      }
    }),
    concat(authLink, httpLink)
  ])
});

const Main = () => (
  <BrowserRouter>
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  </BrowserRouter>
);

ReactDOM.render(<Main />, document.getElementById("root"));
serviceWorker.unregister();
