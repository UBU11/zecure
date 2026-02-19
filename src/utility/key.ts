import crypto from "crypto";
import fs from "fs";
import path from "path";
import "dotenv/config";


const algorithm = "aes-256-gcm";
const public_key = fs.readFileSync(path.resolve(__dirname, "../../cert/cert.pem"),'utf8')


const secretKeyHex = process.env.SECRET_KEY;
if (!secretKeyHex) {
  throw new Error("SECRET_KEY environment variable is not defined");
}

const key = Buffer.from(secretKeyHex, "hex");
if (key.length !== 32) {
  throw new Error("SECRET_KEY must be 32 bytes (64 hex characters)");
}

const EncryptedKey = crypto.publicEncrypt({
  key: public_key,
  padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
  oaepHash: 'sha256',
}, key)

const dataPath = path.resolve(__dirname, "../data/esp32.json");

async function encryptJsonFile(inputFile: string, outputFile: string) {
  try {
    const plainText = fs.readFileSync(inputFile, "utf8");

    const iv = crypto.randomBytes(12);

    const cipher = crypto.createCipheriv(algorithm, key, iv);

    let cipherText = cipher.update(plainText, "utf8", "hex");
    cipherText += cipher.final("hex");

    const authTag = cipher.getAuthTag().toString("hex");


    const payload = JSON.stringify({
      EncryptedKey: EncryptedKey.toString("hex"),
      iv: iv.toString("hex"),
      authTag,
      cipherText,
    })

    fs.writeFileSync(outputFile, payload);
    console.log(`Successfully encrypted data to ${outputFile}`);
  } catch (error) {
    if ((error as any).code === "ENOENT") {
      console.log("File not found");
    }
    console.error(error);
  }
}

async function decryptFile(inputFile: string, outputFile: string) {
  try {
    const fileContent = fs.readFileSync(inputFile, "utf8");
    let {iv, authTag, cipherText} = JSON.parse(fileContent)

    if(!iv || !authTag || !cipherText){
      throw new Error("Invalid encrypted file format. Expected IV:AuthTag:EncryptedData")
    }

     iv = Buffer.from(iv, "hex");
     authTag = Buffer.from(authTag, "hex");
     cipherText = cipherText;

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(cipherText, "hex", "utf8");
    decrypted += decipher.final("utf8");

    fs.writeFileSync(outputFile, decrypted);
    console.log(`Successfully decrypted data to ${outputFile}`);
  } catch (error) {
    if ((error as any).code === "ENOENT") {
      console.log("File not found");
    }
    console.error(error);
  }
}

// encryptJsonFile(dataPath, dataPath + ".enc");
decryptFile(dataPath + ".enc", dataPath);

export { encryptJsonFile, decryptFile };
