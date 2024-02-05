import fs from "fs";
import { sign } from "tweetnacl";
import { decodeBase64 } from "tweetnacl-util";
import { decryptSymmetric } from "../encryption/tweetnacl";
import { Joiner, LicenseFileKeys } from "./licenseKeyConstants";

var licenseError = "";
var licenseInfo = null;

const NUM_MILLIS_IN_DAY = 24 * 60 * 60 * 1000;
const MONITOR_LICENSE_INTERVAL = 1 * NUM_MILLIS_IN_DAY; // 1 day
const LICENSE_FILE = process.env.LICENSE_FILE || "./license/license.lic";

export const LicenseRestriction = {
  MaxNumberOfEngines: "MaxNumberOfEngines",
  MaxNumberOfDatabases: "MaxNumberOfDatabases",
};

export const loadLicense = () => {
  if (!licenseInfo) {
    var rawLicenseData = fs.readFileSync(LICENSE_FILE).toString();
    rawLicenseData = rawLicenseData.replace(/[\n\r]/g, "");
    const licenseAndSignature = rawLicenseData.match(/^====.+==== (.+)$/)[1];
    //console.log(rawLicenseData.match(/^====.+==== (.+)/));
    const [license, signature] = licenseAndSignature.split(Joiner);
    var decodedLicense = decodeBase64(license);
    var decodedSignature = decodeBase64(signature);
    const decodedSigningPublicKey = decodeBase64(
      LicenseFileKeys.SigningPublicKey
    );
    const isValid = sign.detached.verify(
      decodedLicense,
      decodedSignature,
      decodedSigningPublicKey
    );
    if (isValid) {
      licenseInfo = decryptSymmetric(license, LicenseFileKeys.SymmetricKey);
    } else {
      licenseError = "License signature cannot be verified";
    }
  }
};

export const getLicenseError = () => licenseError;

export const isLicenseValid = () => {
  try {
    loadLicense();
    return !licenseError;
  } catch (e) {
    licenseError = `${e}`;
    return false;
  }
};

export const isCloudLicense = () => {
  try {
    loadLicense();
    return licenseInfo.license_type === "Cloud";
  } catch (e) {
    licenseError = `${e}`;
    return false;
  }
};

export const getLicenseTypeAndExpiration = () => {
  try {
    loadLicense();
    return {
      licenseType: licenseInfo.license_type,
      licenseExpires: licenseInfo.license_expiration ? true : false,
      licenseExpiration: licenseInfo.license_expiration
        ? `${licenseInfo.license_expiration}`
        : "",
    };
  } catch (e) {
    licenseError = `${e}`;
    return {
      licenseType: "Error loading license",
      licenseExpiration: new Date().getTime(),
    };
  }
};

export const isBasicLicense = () => {
  try {
    loadLicense();
    return licenseInfo.license_type === "Basic";
  } catch (e) {
    licenseError = `${e}`;
    return false;
  }
};

export const isEnterpriseLicense = () => {
  try {
    loadLicense();
    return licenseInfo.license_type === "Enterprise";
  } catch (e) {
    licenseError = `${e}`;
    return false;
  }
};

export const isEnterpriseTrialLicense = () => {
  try {
    loadLicense();
    return licenseInfo.license_type === "EnterpriseTrial";
  } catch (e) {
    licenseError = `${e}`;
    return false;
  }
};

export const isLabsLicense = () => {
  try {
    loadLicense();
    return licenseInfo.license_type === "Labs";
  } catch (e) {
    licenseError = `${e}`;
    return false;
  }
};

export const getLicenseInfo = () => {
  try {
    loadLicense();
    return licenseInfo;
  } catch (e) {
    licenseError = `${e}`;
    return {};
  }
};

export const getLicenseRestriction = (restrictionName) => {
  try {
    loadLicense();
    return licenseInfo.restrictions[restrictionName];
  } catch (e) {
    licenseError = `${e}`;
    return 0;
  }
};

export const handleLicenseExpiration = (exitOnExpiration) => {
  //console.log('exitOnExpiration: ', exitOnExpiration)

  var licenseExpirationInfo = getLicenseExpirationInfo();
  if (licenseExpirationInfo.licenseExpires) {
    console.log(licenseExpirationInfo.licenseExpireMessage);
    if (licenseExpirationInfo.licenseExpired && exitOnExpiration) {
      process.exit(1);
    }
  }
};

export const getLicenseExpirationInfo = () => {
  var licenseInfo = getLicenseInfo();
  var expires = licenseInfo.license_expiration;
  //console.log('expires: ', expires)
  if (expires) {
    var timeRemaining = expires - new Date().getTime();
    var numDaysRemaining = Math.floor(timeRemaining / NUM_MILLIS_IN_DAY) + 1;
    var licenseExpireDate = new Date(
      licenseInfo.license_expiration
    ).toLocaleDateString();
    var licenseExpired = false;
    var licenseExpireMessage = "";
    if (numDaysRemaining >= 0) {
      const warning = numDaysRemaining <= 30 ? "WARNING: " : "";
      licenseExpireMessage = `${warning}You have ${numDaysRemaining} day(s) left on your license`;
    } else {
      licenseExpired = true;
      licenseExpireMessage = `Your license expired on ${licenseExpireDate}, contact Neo4j to get a new license`;
    }
    return {
      licenseExpires: true,
      licenseExpired: licenseExpired,
      //licenseExpired: true, // --> uncomment for testing
      numDaysRemaining: numDaysRemaining,
      licenseExpireDate: licenseExpireDate,
      licenseExpireMessage: licenseExpireMessage,
    };
  } else {
    return {
      licenseExpires: false,
      licenseExpired: false,
    };
  }
};

export const monitorLicenseExpiration = (exitOnExpiration) => {
  var licenseInfo = getLicenseInfo();
  var expires = licenseInfo.license_expiration;
  if (expires) {
    // if license expires during monitoring, exitOnExpiration will be undefined, meaning it will log a warning,
    //   but it won't shut it down
    setTimeout(monitorLicenseExpiration, MONITOR_LICENSE_INTERVAL);

    // right now exitOnExpiration is only set during startup, so if expired and true, the process won't start
    handleLicenseExpiration(exitOnExpiration);
  }
};
