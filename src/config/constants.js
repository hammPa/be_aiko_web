import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const PORT = process.env.PORT || 3000;
export const USER_CODE_DIR = path.resolve(__dirname, "../../", process.env.USER_CODE_DIR || "user_code");
export const AIKO_JS_DIR = path.resolve(__dirname, "../../", process.env.AIKO_JS_DIR || "../aiko_js");