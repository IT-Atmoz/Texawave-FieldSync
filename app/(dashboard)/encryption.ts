import CryptoJS from "crypto-js";

const SECRET_KEY = "abz123zaA@123"; // replace in prod

export const encrypt = (text: string): string => {
  return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
};

export const decrypt = (cipherText: string): string => {
  const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
};

export const encryptObject = (obj: Record<string, any>): Record<string, string> => {
  const encrypted: Record<string, string> = {};
  for (const key in obj) {
    const encKeyRaw = CryptoJS.AES.encrypt(key, SECRET_KEY).toString();
    const encKey = btoa(encKeyRaw).replace(/[.#$/\[\]]/g, "_"); // replace illegal characters
    const encVal = CryptoJS.AES.encrypt(String(obj[key]), SECRET_KEY).toString();
    encrypted[encKey] = encVal;
  }
  return encrypted;
};


export const decryptObject = (obj: Record<string, string>): Record<string, string> => {
  const decrypted: Record<string, string> = {};
  for (const key in obj) {
    decrypted[decrypt(key)] = decrypt(obj[key]);
  }
  return decrypted;
};
