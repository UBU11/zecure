import "dotenv/config";

const requiredEnvVars = ["SECRET_KEY", "SUPABASE_API"];
const missingVars = requiredEnvVars.filter((v) => !process.env[v]);

if (missingVars.length > 0) {
  console.error("Pre-flight Check Failed!");
  console.error("Missing required environment variables:", missingVars.join(", "));
  console.error("Please check your .env file.");
  process.exit(1);
}

console.log("✅ Environment check passed.");
process.exit(0);
