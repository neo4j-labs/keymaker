import dotenv from "dotenv";
import { secretbox, box, randomBytes } from "tweetnacl";
import {
  encodeUTF8,
  decodeUTF8,
  encodeBase64,
  decodeBase64,
} from "tweetnacl-util";

dotenv.config();
export const generateAsymmetricKeyPair = () => box.keyPair();
export const generateSymmetricKey = () =>
  encodeBase64(randomBytes(secretbox.keyLength));

export const encodeKeyPairForStorage = (keyPair) => {
  const json = JSON.stringify({
    encodedSecretKey: encodeBase64(keyPair.secretKey),
    encodedPublicKey: encodeBase64(keyPair.publicKey),
  });
  var base64Json = Buffer.from(json).toString("base64");
  return base64Json;
};

export const decodeKeyPairFromStorage = (str) => {
  const json = Buffer.from(str, "base64").toString("ascii");
  var encodedObj = JSON.parse(json);
  var keyPair = {
    secretKey: decodeBase64(encodedObj.encodedSecretKey),
    publicKey: decodeBase64(encodedObj.encodedPublicKey),
  };
  return keyPair;
};

export const Uint8ArrayToBase64String = (buf) => encodeBase64(buf);
export const Base64StringToUint8Array = (str) => decodeBase64(str);

export const getAsymmetricEncryptionKey = (
  serverPublicKey,
  browserPrivateKey
) => {
  return box.before(serverPublicKey, browserPrivateKey);
};

export const getAsymmetricDecryptionKey = (
  serverPrivateKey,
  browserPublicKey
) => box.before(browserPublicKey, serverPrivateKey);

// https://github.com/dchest/tweetnacl-js/wiki/Examples
const newNonce = () => randomBytes(secretbox.nonceLength);

export const encryptSymmetric = (json, key) => {
  const keyUint8Array = decodeBase64(key);
  const nonce = newNonce();
  const messageUint8 = decodeUTF8(JSON.stringify(json));
  const box = secretbox(messageUint8, nonce, keyUint8Array);
  const fullMessage = new Uint8Array(nonce.length + box.length);
  fullMessage.set(nonce);
  fullMessage.set(box, nonce.length);
  const base64FullMessage = encodeBase64(fullMessage);
  return base64FullMessage;
};

export const decryptSymmetric = (messageWithNonce, key) => {
  const keyUint8Array = decodeBase64(key);
  const messageWithNonceAsUint8Array = decodeBase64(messageWithNonce);
  const nonce = messageWithNonceAsUint8Array.slice(0, secretbox.nonceLength);
  const message = messageWithNonceAsUint8Array.slice(
    secretbox.nonceLength,
    messageWithNonce.length
  );
  const decrypted = secretbox.open(message, nonce, keyUint8Array);
  if (!decrypted) {
    throw new Error("Could not decrypt message");
  }
  const base64DecryptedMessage = encodeUTF8(decrypted);
  return JSON.parse(base64DecryptedMessage);
};

export const encryptAsymmetric = (json, secretOrSharedKey) => {
  const nonce = newNonce();
  const messageUint8 = decodeUTF8(JSON.stringify(json));
  const encrypted = box.after(messageUint8, nonce, secretOrSharedKey);
  const fullMessage = new Uint8Array(nonce.length + encrypted.length);
  fullMessage.set(nonce);
  fullMessage.set(encrypted, nonce.length);
  const base64FullMessage = encodeBase64(fullMessage);
  return base64FullMessage;
};

export const decryptAsymmetric = (messageWithNonce, secretOrSharedKey) => {
  const messageWithNonceAsUint8Array = decodeBase64(messageWithNonce);
  const nonce = messageWithNonceAsUint8Array.slice(0, box.nonceLength);
  const message = messageWithNonceAsUint8Array.slice(
    box.nonceLength,
    messageWithNonce.length
  );
  const decrypted = box.open.after(message, nonce, secretOrSharedKey);
  if (!decrypted) {
    throw new Error("Could not decrypt message");
  }
  const base64DecryptedMessage = encodeUTF8(decrypted);
  return JSON.parse(base64DecryptedMessage);
};
