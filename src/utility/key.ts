import crypto from "crypto";
import fs from "fs";
import path from "path";
import "dotenv/config";

const algorithm = "aes-256-gcm";

const secretKeyHex = process.env.SECRET_KEY;
if (!secretKeyHex) {
  throw new Error("SECRET_KEY environment variable is not defined");
}

const key = Buffer.from(secretKeyHex, "hex");
if (key.length !== 32) {
  throw new Error("SECRET_KEY must be 32 bytes (64 hex characters)");
}

const dataPath = path.resolve(__dirname, "../data/esp32.json");

async function encryptJsonFile(inputFile: string, outputFile: string) {
  try {
    const plainText = fs.readFileSync(inputFile, "utf8");

    const iv = crypto.randomBytes(12);

    const cipher = crypto.createCipheriv(algorithm, key, iv);

    let encryptedText = cipher.update(plainText, "utf8", "hex");
    encryptedText += cipher.final("hex");

    const authTag = cipher.getAuthTag().toString("hex");

    // Format: IV:AuthTag:EncryptedData
    const payload = `${iv.toString("hex")}:${authTag}:${encryptedText}`;

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
    const parts = fileContent.split(":");

    if (parts.length !== 3) {
      throw new Error("Invalid encrypted file format. Expected IV:AuthTag:EncryptedData");
    }

    const iv = Buffer.from(parts[0], "hex");
    const authTag = Buffer.from(parts[1], "hex");
    const encryptedText = parts[2];

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedText, "hex", "utf8");
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
// decryptFile(dataPath + ".enc", dataPath);

export { encryptJsonFile, decryptFile };

