import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, "../../.env");

if (fs.existsSync(envPath)) {
    const result = dotenv.config({ path: envPath, override: true });
    if (result.parsed) {
        console.log("✓ .env variables loaded successfully");
    } else {
        console.warn("⚠️ .env file found but failed to parse");
    }
} else {
    console.warn("⚠️ .env file NOT found at:", envPath);
}

// Ensure critical variables are at least defined in process.env
const apiKey = process.env.VITE_ANTHROPIC_API_KEY;
if (apiKey) {
    console.log("✓ API Key detected (Length:", apiKey.length, ")");
} else {
    console.warn("❌ VITE_ANTHROPIC_API_KEY is missing from environment");
}
