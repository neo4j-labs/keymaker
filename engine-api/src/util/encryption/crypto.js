import dotenv from "dotenv";
import CryptoJS from "crypto-js";

dotenv.config();
const v1_key = process.env.ENCRYPTION_KEY;
const ENCRYPTION_VERSION_SEPARATOR = "_$$_";

export const encrypt = (value) => {
  return CryptoJS.AES.encrypt(value, v1_key).toString();
};

export const decrypt = (_value, keys) => {
  var { version, value } = getEncyptionVersionAndValue(_value);
  if (version === "v1") {
    return CryptoJS.AES.decrypt(value, v1_key).toString(CryptoJS.enc.Utf8);
  } else if (version === "v2") {
    const { asymmetricDecryptionKey } = keys;
    return decryptAsymmetric(value, asymmetricDecryptionKey);
  } else {
    throw new Error(`Unrecognized encryption version '${version}'`);
  }
};

const getEncyptionVersionAndValue = (value) => {
  if (value && value.split) {
    const tokens = value.split(ENCRYPTION_VERSION_SEPARATOR);
    return tokens.length && tokens.length > 1
      ? { version: tokens[0], value: tokens[1] }
      : { version: "v1", value: value };
  } else {
    return { version: "v1", value: value };
  }
};
