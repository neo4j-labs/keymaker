import fs from "fs";
import { sign } from "tweetnacl";
import { decodeBase64 } from "tweetnacl-util";
import { decryptSymmetric } from "./encryption/tweetnacl";

var licenseError = "";
var licenseInfo = null;
const Joiner = "_$$_";
const LicenseFileKeys = {
  SymmetricKey: "gLuRwnFqigYJVoOiosIpnoVmQphrY0LKLkzzdqRkUjE=",
  SigningPublicKey: "Z/nW0FFRdjxXPLJMtthtrRkKpeNT16gTF2EmfsBmMrQ=",
};

const NUM_MILLIS_IN_DAY = 24 * 60 * 60 * 1000;
const MONITOR_LICENSE_INTERVAL = 1 * NUM_MILLIS_IN_DAY; // 1 day
const LICENSE_FILE = process.env.LICENSE_FILE || "./license/license.lic"

export const LicenseRestriction = {
  MaxNumberOfEngines: "MaxNumberOfEngines",
  MaxNumberOfDatabases: "MaxNumberOfDatabases",
};

export const loadLicense = () => {
  if (!licenseInfo) {
    var rawLicenseData = fs.readFileSync(LICENSE_FILE).toString();
    rawLicenseData = rawLicenseData.replace(/[\n\r]/g, "");
    const licenseAndSignature = rawLicenseData.match(/^====.+==== (.+)$/)[1];
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


export const isLabsLicense = () => {
  try {
    loadLicense();
    return licenseInfo.license_type === "Labs";
  } catch (e) {
    licenseError = `${e}`;
    return false;
  }
};

export const isEnterpriseLicense = () => {
  try {
    loadLicense();
    return licenseInfo.license_type === "Enterpise";
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
  var licenseInfo = getLicenseInfo();
  var expires = licenseInfo.license_expiration;
  if (expires) {
    var timeRemaining = expires - new Date().getTime();
    var numDaysRemaining = Math.floor(timeRemaining / NUM_MILLIS_IN_DAY) + 1;
    if (numDaysRemaining >= 0) {
      const warning = numDaysRemaining <= 30 ? "WARNING: " : "";
      console.log(
        `${warning}You have ${numDaysRemaining} day(s) left on your license`
      );
    } else {
      var licenseExpireDate = new Date(
        licenseInfo.license_expiration
      ).toLocaleDateString();
      console.log(
        `Your license expired on ${licenseExpireDate}, contact Neo4j to get a new license`
      );
      if (exitOnExpiration) {
        process.exit(1);
      }
    }
  }
};

export const monitorLicenseExpiration = (exitOnExpiration) => {
  var licenseInfo = getLicenseInfo();
  var expires = licenseInfo.license_expiration;
  if (expires) {
    setTimeout(monitorLicenseExpiration, MONITOR_LICENSE_INTERVAL);
    handleLicenseExpiration(exitOnExpiration);
  }
};
