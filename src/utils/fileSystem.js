import fs from "fs";

export function ensureDir(dir) {
	if(!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
}

export function readDebugMap(debugPath) {
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
