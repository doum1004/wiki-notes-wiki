const fs = require("fs");
const path = require("path");

const WIKILINK_RE = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
const WIKI_DIR = "wiki";
const OUT_DIR = "dist";

function findMdFiles(dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findMdFiles(full));
    } else if (entry.name.endsWith(".md")) {
      results.push(full);
    }
  }
  return results;
}

function extractTitle(content, filePath) {
  const match = content.match(/^#\s+(.+)$/m);
  if (match) return match[1].trim();
  return path.basename(filePath, ".md").replace(/-/g, " ");
}

function resolveLink(target, allFiles) {
  const withMd = target.endsWith(".md") ? target : target + ".md";
  const candidates = allFiles.map((f) => f.replace(/\\/g, "/"));

  if (candidates.includes(withMd)) return withMd;

  const withWiki = "wiki/" + withMd;
  if (candidates.includes(withWiki)) return withWiki;

  const dirs = ["wiki/entities", "wiki/concepts", "wiki/sources", "wiki/synthesis"];
  for (const dir of dirs) {
    const candidate = dir + "/" + withMd;
    if (candidates.includes(candidate)) return candidate;
  }

  const basename = withMd.split("/").pop();
  const found = candidates.find((p) => p.endsWith("/" + basename) || p === basename);
  if (found) return found;

  return null;
}

const files = findMdFiles(WIKI_DIR);
const nodes = [];
const edges = [];

for (const file of files) {
  const content = fs.readFileSync(file, "utf-8");
  const relPath = file.replace(/\\/g, "/");
  const dir = relPath.split("/")[1] || "wiki";
  nodes.push({ id: relPath, title: extractTitle(content, file), dir });

  let match;
  const re = new RegExp(WIKILINK_RE.source, "g");
  while ((match = re.exec(content)) !== null) {
    const resolved = resolveLink(match[1], files.map((f) => f.replace(/\\/g, "/")));
    if (resolved) {
      edges.push({ source: relPath, target: resolved });
    }
  }
}

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(
  path.join(OUT_DIR, "graph.json"),
  JSON.stringify({ nodes, edges }, null, 2)
);
console.log("Graph: " + nodes.length + " nodes, " + edges.length + " edges → dist/graph.json");
