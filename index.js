import express from "express";
import { exec } from "child_process";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());


const PORT = process.env.PORT || 3000; // dinamis
const USER_CODE_DIR = process.env.USER_CODE_DIR || "user_code";
const AIKO_JS_DIR = process.env.AIKO_JS_DIR || "../aiko_js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


app.post("/api/transpile", (req, res) => {
  const code = req.body.code;
  const userCodeDir = path.resolve(__dirname, USER_CODE_DIR);

  // pastikan folder ada
  if (!fs.existsSync(userCodeDir)) {
    fs.mkdirSync(userCodeDir, { recursive: true });
  }

  const inputFile = path.join("main.ak");

  // simpan file sementara
  fs.writeFileSync(inputFile, code);

  const relativePath = path.relative(
    path.resolve(__dirname, AIKO_JS_DIR), // base path aiko_js
    inputFile
  );

  // jalankan run.sh hanya sampai asm
  const runScript = path.resolve(__dirname, `${AIKO_JS_DIR}/run_fs.sh`);
  // console.log(`${runScript} ${relativePath}`);
  exec(`bash ${runScript} ${relativePath}`, { cwd: path.resolve(__dirname, AIKO_JS_DIR) }, (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ error: stderr || error.message });
    }

    // console.log("ga error");
    
    // baca hasil asm
    const baseName = path.basename(inputFile, '.ak');
    const asmPath = path.resolve(__dirname, `${AIKO_JS_DIR}/out/${baseName}.asm`); // hasilnya pasti ada di dalam aiko_js/out
    if (!fs.existsSync(asmPath)) {
      return res.status(500).json({ error: "main.asm not generated" });
    }
    
    // const asm = fs.readFileSync(asmPath, 'utf8');
    const asmContent = fs.readFileSync(asmPath, 'utf8').split("\n");

    // Align komentar
    let maxLen = 0;
    let lines = asmContent.map(line => {
        const idx = line.indexOf(";");
        if (idx !== -1) {
            const code = line.slice(0, idx).trimEnd();
            const comment = line.slice(idx + 1).trim();
            if (code.length > maxLen) maxLen = code.length;
            return { code, comment };
        } else {
            return { code: line, comment: null };
        }
    });

    // Gabungkan kembali
    const alignedAsm = lines.map(({ code, comment }) =>
      comment ? code.padEnd(maxLen + 2) + "; " + comment : code
    ).join("\n");

    return res.json({ asm: alignedAsm, logs: stdout });
  });
});

app.listen(PORT, () => console.log("Backend running on http://localhost:${PORT}"));
