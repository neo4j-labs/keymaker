import auth0 from "auth0-js";
import { fetchGraphQL } from "../fetchGraphQL/fetchGraphQL";
import { getDynamicConfigValue } from "../dynamicConfig";

class Auth {
  constructor() {
    this.auth0 = new auth0.WebAuth({
      domain: getDynamicConfigValue("REACT_APP_AUTH_DOMAIN"),
      clientID: getDynamicConfigValue("REACT_APP_AUTH_CLIENT_ID"),
      redirectUri: getDynamicConfigValue("REACT_APP_AUTH_CALLBACK"),
      responseType: "token id_token",
      scope: "openid email profile",
      sso: false,
    });
    this.login = this.login.bind(this);
    this.silentAuth = this.silentAuth.bind(this);
    this.handleAuthentication = this.handleAuthentication.bind(this);
    this.isAuthenticated = this.isAuthenticated.bind(this);
    this.logout = this.logout.bind(this);
  }

  login() {
    this.auth0.authorize({
      prompt: "select_account",
      theme: { primaryColor: "#0085be" },
    });
  }

  getIdToken() {
    return localStorage.getItem('id_token');
  }

  async createUser() {
    // alert('in create user');
    if (!this.getIdToken()) {
      // alert('throwing error login_required');
      throw new Error('login_required');
    }

    const uri = getDynamicConfigValue("REACT_APP_GRAPHQL_URI");
    const token = this.getIdToken();

    const query = `
      mutation createUser{
        createUser{
          email
        }
      }
    `;

    var promise = new Promise((resolve, reject) => {
      fetchGraphQL({ uri, query, token })
        .then(() => {
          resolve();
        })
        .catch((error) => {
          console.log("Auth error: " + error);
          // alert("Auth error: " + JSON.stringify(error));
          this.logout();
          reject();
        });
    })
    return await promise;
  }

  verifyDemoAccess = async ({ caller }) => {
    if (!this.getIdToken()) {
      return false;
    }

    const uri = getDynamicConfigValue('REACT_APP_HIVE_URI');
    const token = this.getIdToken();
    /*
    const query = `
      mutation MergeUserAndLogSignIn($id: ID!) {
        mergeUserAndLogSignIn(id: $id){
          email
        }
      }
    `;
    */
    const query = `
      mutation verifyUserHasAccessToSolution ($baseUrl: String!) {
        result: verifyUserHasAccessToSolution(baseUrl: $baseUrl) {
          hasAccess
          keymakerApiKey
          userPrimaryOrganization
          solutionId
          solutionName
          solutionType
          matchingDeploymentId
          matchingDeploymentUrl
          matchingDeploymentName
        }
      }
   `
    const variables = {
      baseUrl: getDynamicConfigValue('REACT_APP_SOLUTION_BASE_URL_IN_HIVE')
    };

    var promise = new Promise((resolve, reject) => {
      fetchGraphQL({ uri, query, variables, token })
        .then((result) => {
          const { data, errors } = result;
          if (errors) {
            console.log(`${caller} verifyDemoAccess access check error (1)`);
            console.log(errors);
            alert(`${caller} verifyDemoAccess access check error (1): ${JSON.stringify(errors)}, returning to Hive.`);
            resolve({ hasAccess: false });
          } else {
            if (data.result && data.result.hasAccess === false) {
              alert('You have not been granted access to this demo, returning to Hive.');
              resolve(data.result);
            } else {
              resolve(data.result);
            }
          }
        })
        .catch(error => {
          console.log(`${caller} verifyDemoAccess access check error (2)`);
          console.log(error);
          alert(`${caller} verifyDemoAccess access check error (2): ${JSON.stringify(error)}, returning to Hive.`);
          resolve({ hasAccess: false });
        });
    })
    return await promise;
  }

  handleAuthentication() {
    return new Promise((resolve, reject) => {
      this.auth0.parseHash(async (err, authResult) => {
        if (err) return reject(err);
        if (!authResult || !authResult.idToken) {
          return reject(err);
        }
        this.setSession(authResult);
        await this.createUser();
        resolve();
      });
    });
  }

  setSession(authResult) {
    // Set the time that the access token will expire at
    var expiresAt = authResult.expiresIn * 1000 + new Date().getTime();

    localStorage.setItem("id_token", authResult.idToken);
    localStorage.setItem("expires_at", expiresAt);
  }

  silentAuth = async () => {
    // alert('silent auth');
    /*
    if (!this.getIdToken()) {
      // alert('throwing error login_required');
      throw new Error('login_required');      
    }
    */

    // alert('calling checkSession promise');
    var promise = new Promise((resolve, reject) => {
      this.auth0.checkSession({}, async (err, authResult) => {
        // alert('checkSession err: ' + JSON.stringify(err || {}) + ' authResult: ' + JSON.stringify(authResult || {}));
        if (err) return reject(err);
        if (!authResult || !authResult.idToken) {
          return reject(err);
        }
        this.setSession(authResult);

        const result = await this.verifyDemoAccess({ caller: 'silentAuth' });
        if (!result.hasAccess) {
          this.removeLocalStorageItems();
          window.location.replace(getDynamicConfigValue('REACT_APP_HIVE_UI'));
        }
        await this.createUser();
        resolve(result.hasAccess);
      });
    });
    return await promise;
  }

  removeLocalStorageItems = () => {
    localStorage.removeItem("id_token");
    localStorage.removeItem("expires_at");
  }

  logout() {
    this.removeLocalStorageItems();
    window.location.replace(
      "https://" +
      getDynamicConfigValue("REACT_APP_AUTH_DOMAIN") +
      "/v2/logout/?returnTo=" +
      getDynamicConfigValue("REACT_APP_PROTOCOL") +
      "%3A%2F%2F" +
      getDynamicConfigValue("REACT_APP_AUTH_LOGOUT_URL") +
      "&client_id=" +
      getDynamicConfigValue("REACT_APP_AUTH_CLIENT_ID")
    );
  }

  isAuthenticated() {
    // Check whether the current time is past
    let expiresAt = JSON.parse(localStorage.getItem('expires_at'));
    // console.log(parseInt(new Date().getTime()) < parseInt(expiresAt));
    return parseInt(new Date().getTime()) < parseInt(expiresAt);
  }
}

const auth = new Auth();
export default auth;
