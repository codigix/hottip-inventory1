
import fs from "fs";

const filePath = "e:/codigix-project/hottip-inventory1/shared/schema.ts";
let content = fs.readFileSync(filePath, "utf-8");

// Fix numeric(name, p, s) -> numeric(name, { precision: p, scale: s })
content = content.replace(/numeric\("(.*?)",\s*(\d+),\s*(\d+)\)/g, 'numeric("$1", { precision: $2, scale: $3 })');

// Fix numeric(name).default(0) -> numeric(name).default("0")
// This is tricky with regex, but we can look for lines that have numeric and .default(0)
const lines = content.split("\n");
const fixedLines = lines.map(line => {
  if (line.includes("numeric") && line.includes(".default(0)")) {
    return line.replace(".default(0)", '.default("0")');
  }
  return line;
});

fs.writeFileSync(filePath, fixedLines.join("\n"), "utf-8");
console.log("Fixed numeric definitions in shared/schema.ts");
