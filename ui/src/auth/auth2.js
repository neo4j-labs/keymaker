import history from "./history";
import { fetchGraphQL } from "../fetchGraphQL/fetchGraphQL";
import { getDynamicConfigValue } from "../dynamicConfig";

const EULA_NAME = "Keymaker Eula";

const login = (email) => {
  const uri = getDynamicConfigValue("REACT_APP_GRAPHQL_URI");
  const token = email;
  const query = `
        mutation LogInLocalUser ($email: String) {
          localUser: logInLocalUser (email: $email) {
            email
          }
        }
      `;
  const variables = { email };

  fetchGraphQL({ uri, query, variables, token })
    .then((result) => {
      if (result.data.localUser.email) {
        setSession(email, true);
        history.replace("/");
      } else {
        logout();
      }
    })
    .catch((err) => {
      console.log(err);
      logout();
    });
};

const setEulaEnterprise = (email) => {
  const uri = getDynamicConfigValue("REACT_APP_GRAPHQL_URI");

  const query = `
        mutation setEulaEnterprise ($email: String) {
          localUser: setEulaEnterprise (email: $email) {
            email
          }
        }
      `;
  const variables = { email };
  const token = email;

  fetchGraphQL({ uri, query, variables, token })
    .then((result) => {
      if (result.data.localUser.email) {
        setSession(email, true);
        history.replace("/");
      } else {
        logout();
      }
    })
    .catch((err) => {
      console.log(err);
      logout();
    });
};

const loginEnterprise = async (email, password) => {
  const uri = getDynamicConfigValue("REACT_APP_GRAPHQL_URI");

  const token = localStorage.getItem("id_token");
  const query = `
      query LoginUser ($input: CustomUser!) {
      loginUser(input: $input) {
         email
         name
         picture
        }
      }
    `;
  const variables = {
    input: { email, password },
  };

  return await fetchGraphQL({ uri, query, variables, token })
    .then((result) => {
      return result.data &&
        result.data.loginUser &&
        result.data.loginUser.email === email
        ? "true"
        : "false";
    })
    .catch((error) => {
      //logout();
    });
};

const setSession = (email, acceptedEula) => {
  // Set the time that the access token will expire at
  let expiresAt = JSON.stringify(
    getDynamicConfigValue("REACT_APP_EXPIRE_TIME") * 1000 + new Date().getTime()
  );
  localStorage.setItem("id_token", email);
  localStorage.setItem("accepted_eula", acceptedEula);
  localStorage.setItem("expires_at", expiresAt);
  // navigate to the home route
};

const logout = () => {
  // Clear access token and ID token from local storage
  localStorage.removeItem("id_token");
  localStorage.removeItem("expires_at");
  var licenseType = localStorage.getItem("licenseType");
  if (licenseType === "Basic") {
    history.replace("/your-email");
  } else if (
    licenseType === "Enterprise" ||
    licenseType === "EnterpriseTrial"
  ) {
    history.replace("/login");
  }
};

const checkLicense = async (bearerId) => {
  const uri = getDynamicConfigValue("REACT_APP_GRAPHQL_URI");
  const token = bearerId;
  const query = `
       query {
         licenseInfo: getLicenseTypeAndExpiration {
           licenseType
           licenseExpires
           licenseExpiration
         }
        } 

      `;

  return await fetchGraphQL({ uri, query, token })
    .then((result) => {
      var response = result.data.licenseInfo;
      localStorage.setItem("licenseType", response.licenseType);
      if (response.licenseExpires) {
        localStorage.setItem(
          "licenseExpiration",
          `${response.licenseExpiration}`
        );
      } else {
        localStorage.removeItem("licenseExpiration");
      }
      return response.licenseType;
    })
    .catch((err) => {
      console.log(err);
    });
};

const isAuthenticated = () => {
  // Check whether the current time is past the
  // access token's expiry time

  let expiresAt = JSON.parse(localStorage.getItem("expires_at"));
  return new Date().getTime() < expiresAt;
};

const acceptedEula = async (email) => {
  const uri = getDynamicConfigValue("REACT_APP_GRAPHQL_URI");
  const token = email;
  const query = `
    query AcceptedEula ($email: String) {
      acceptedEula (email: $email)
    }
  `;
  const variables = { email };

  return await fetchGraphQL({ uri, query, variables, token })
    .then((result) => {
      const acceptedEula = result.data.acceptedEula;
      return acceptedEula;
    })
    .catch(() => {
      logout();
    });
};

const callLogEulaAcceptance = (email) => {
    if (localStorage.getItem("accepted_eula_recorded") !== "true") {
    const uri = getDynamicConfigValue("REACT_APP_EULA_GRAPHQL_URI");
    if (uri && uri.toLowerCase() === "ignore") return;

    const query = `
            mutation logEulaAcceptance ($userEmail: String!, $eulaName: String!) {
              logEulaAcceptance (userEmail:$userEmail, eulaName:$eulaName) {
                name
              }
            }
        `;
    const variables = { userEmail: email, eulaName: EULA_NAME };

    fetchGraphQL({ uri, query, variables })
      .then((result) => {
        if (
          result.data &&
          result.data.logEulaAcceptance &&
          result.data.logEulaAcceptance.name === EULA_NAME
        ) {
          localStorage.setItem("accepted_eula_recorded", "true");
        } else {
          console.log(
            "Could not record Eula acceptance, unexpected response: ",
            result
          );
        }
      })
      .catch((err) => {
        console.log("Could not record Eula acceptance", err);
        setTimeout(() => callLogEulaAcceptance(email), 1000 * 600); // call again in 10 min
      });
  }
};

export {
  login,
  loginEnterprise,
  setSession,
  logout,
  isAuthenticated,
  acceptedEula,
  callLogEulaAcceptance,
  checkLicense,
  setEulaEnterprise,
};
