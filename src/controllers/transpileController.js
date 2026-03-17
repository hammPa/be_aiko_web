import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { AIKO_JS_DIR, USER_CODE_DIR } from "../config/constants.js";
import { ensureDir, readDebugMap } from "../utils/fileSystem.js";
import { alignAsmComments } from "../utils/asmFormatter.js";

export const handleTranspile = (req, res) => {
    const { code, userInput } = req.body;

    ensureDir(USER_CODE_DIR);
    const inputFile = path.join(USER_CODE_DIR, "main.ak");
    fs.writeFileSync(inputFile, code);

    const relativePath = path.relative(AIKO_JS_DIR, inputFile);
    const runScript = path.resolve(AIKO_JS_DIR, "run_fs.sh");

    const child = spawn("bash", [runScript, relativePath], { cwd: AIKO_JS_DIR });

    let stdout = "";
    let stderr = "";

    if (userInput) {
        child.stdin.write(userInput + "\n");
        child.stdin.end();
    }

    child.stdout.on("data", (data) => { stdout += data; });
    child.stderr.on("data", (data) => { stderr += data; });

    child.on("close", (exitCode) => {
        const allLogs = stdout + stderr;
        const baseName = "main"; // Sesuai nama file input
        const asmPath = path.resolve(AIKO_JS_DIR, `out/${baseName}.asm`);
        const debugPath = path.resolve(AIKO_JS_DIR, `out/${baseName}.debug.json`);
        
        if (exitCode !== 0 || !fs.existsSync(asmPath)) {
            return res.status(400).json({ 
                error: "Compilation Failed", 
                logs: allLogs || "No output from compiler." 
            });
        }

        const { sourceMap, headerOffset } = readDebugMap(debugPath);
        const asmRaw = fs.readFileSync(asmPath, "utf8");

        res.json({
            asm: alignAsmComments(asmRaw),
            logs: allLogs,
            sourceMap,
            headerOffset
        });
    });
};