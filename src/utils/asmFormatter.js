export function alignAsmComments(asmText) {
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