import crypto from "crypto";
import fs from "fs";
import path from "path";
import "dotenv/config";


const private_key = fs.readFileSync(path.resolve(__dirname, "../../cert/private_key.pem"), 'utf8');

const algorithm = "aes-256-gcm";


function decryptPayload(payloadStr: string): string {
  try {
    const { EncryptedKey, iv, authTag, cipherText } = JSON.parse(payloadStr);

    if (!EncryptedKey || !iv || !authTag || !cipherText) {
      throw new Error("Missing required encryption fields in payload");
    }

    
    const decryptedKey = crypto.privateDecrypt(
      {
        key: private_key,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      Buffer.from(EncryptedKey, 'hex')
    );

    const decipher = crypto.createDecipheriv(
      algorithm,
      decryptedKey,
      Buffer.from(iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));

    let decrypted = decipher.update(cipherText, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Payload decryption error:", error);
    throw error;
  }
}

async function encryptJsonFile(inputFile: string, outputFile: string) {
  try {
    const plainText = fs.readFileSync(inputFile, "utf8");
    const secretKeyHex = process.env.SECRET_KEY;
    if (!secretKeyHex) throw new Error("SECRET_KEY not in .env");
    const key = Buffer.from(secretKeyHex, "hex");

    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(algorithm, key, iv);

    let cipherText = cipher.update(plainText, "utf8", "hex");
    cipherText += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");

    const public_key = fs.readFileSync(path.resolve(__dirname, "../../cert/public_key.pem"),'utf8');
    const rsaEncryptedKey = crypto.publicEncrypt({
      key: public_key,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    }, key);

    const payload = JSON.stringify({
      EncryptedKey: rsaEncryptedKey.toString("hex"),
      iv: iv.toString("hex"),
      authTag,
      cipherText,
    });

    fs.writeFileSync(outputFile, payload);
    console.log(`Successfully encrypted data to ${outputFile}`);
  } catch (error) {
    console.error(error);
  }
}

async function decryptFile(inputFile: string, outputFile: string) {
  try {
    const fileContent = fs.readFileSync(inputFile, "utf8");
    const decrypted = decryptPayload(fileContent);
    fs.writeFileSync(outputFile, decrypted);
    console.log(`Successfully decrypted data to ${outputFile}`);
  } catch (error) {
    console.error("File decryption error:", error);
  }
}

export { encryptJsonFile, decryptFile, decryptPayload };
