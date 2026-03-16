import express from "express";
import { spawn } from "child_process";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();


// Setup dasar
const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;
const USER_CODE_DIR = process.env.USER_CODE_DIR || "user_code";
const AIKO_JS_DIR = process.env.AIKO_JS_DIR || "../aiko_js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Helper functions
function ensureDir(dir) {
	if(!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
}

function readDebugMap(debugPath) {
  	let sourceMap = [];
  	let headerOffset = 0;

  	if (!fs.existsSync(debugPath)) {
  	  	console.warn("[WARN] File debug.json TIDAK DITEMUKAN.");
  	  	return { sourceMap, headerOffset };
  	}

  	try {
  	  	const content = fs.readFileSync(debugPath, "utf8");
  	  	if (!content.trim()) {
  	  	  	console.warn("[WARN] File debug.json kosong.");
  	  	  	return { sourceMap, headerOffset };
  	  	}

  	  	const json = JSON.parse(content);
  	  	if (Array.isArray(json.sourceMap)) {
  	  	  	sourceMap = json.sourceMap;
  	  	  	headerOffset = json.headerOffset || 0;
  	  	  	console.log(`[SUCCESS] SourceMap dimuat: ${sourceMap.length} items`);
  	  	} else {
  	  	  	console.warn("[WARN] sourceMap tidak valid.");
  	  	}
  	} catch (err) {
  	  	console.error("[ERROR] Gagal parsing debug json:", err.message);
  	}

  	return { sourceMap, headerOffset };
}

function alignAsmComments(asmText) {
  	const lines = asmText.split("\n");
  	let maxLen = 0;

  	const parsed = lines.map(line => {
  	  	const idx = line.indexOf(";");
  	  	if (idx === -1) return { code: line, comment: null };
		
  	  	const code = line.slice(0, idx).trimEnd();
  	  	const comment = line.slice(idx + 1).trim();
  	  	maxLen = Math.max(maxLen, code.length);
		
  	  	return { code, comment };
  	});

  	return parsed
  	  	.map(({ code, comment }) =>
  	  	  	comment ? code.padEnd(maxLen + 2) + "; " + comment : code
  	  	)
  	  	.join("\n");
}


// Endpoint utama
app.post("/api/transpile", (req, res) => {
  	const { code, userInput } = req.body;
  	const userCodeDir = path.resolve(__dirname, USER_CODE_DIR);

  	ensureDir(userCodeDir);

  	const inputFile = path.join("main.ak");
  	fs.writeFileSync(inputFile, code);

  	const relativePath = path.relative(
  	  	path.resolve(__dirname, AIKO_JS_DIR),
  	  	inputFile
  	);

  	const runScript = path.resolve(__dirname, `${AIKO_JS_DIR}/run_fs.sh`);


  	const child = spawn("bash", [runScript, relativePath], {
  	  	cwd: path.resolve(__dirname, AIKO_JS_DIR),
  	});

  	let stdout = "";
  	let stderr = "";

  	if (userInput) {
  	  	child.stdin.write(userInput + "\n");
  	  	child.stdin.end();
  	}

  	child.stdout.on("data", (data) => { stdout += data; });
  	child.stderr.on("data", (data) => { stderr += data; });

  	child.on("close", (exitCode) => {
  	  	if (exitCode !== 0) {
  	  	  	// Jika error (misal compile error), kirim response error
  	  	  	return res.status(500).json({ error: stderr || "Execution failed" });
  	  	}

  	  	const baseName = path.basename(inputFile, ".ak");
  	  	const asmPath = path.resolve(__dirname, `${AIKO_JS_DIR}/out/${baseName}.asm`);
  	  	const debugPath = path.resolve(__dirname, `${AIKO_JS_DIR}/out/${baseName}.debug.json`);

  	  	if (!fs.existsSync(asmPath)) {
  	  	  	return res.status(500).json({ error: "main.asm not generated" });
  	  	}

  	  	const { sourceMap, headerOffset } = readDebugMap(debugPath);
  	  	const asmRaw = fs.readFileSync(asmPath, "utf8");
  	  	const alignedAsm = alignAsmComments(asmRaw);

  	  	// Kirim hasil ke frontend
  	  	return res.json({
  	  	  	asm: alignedAsm,
  	  	  	logs: stdout, // stdout sekarang berisi output program + hasil print
  	  	  	sourceMap,
  	  	  	headerOffset
  	  	});
  	});
});

app.listen(PORT, () =>
  	console.log(`Backend running on http://localhost:${PORT}`)
);
