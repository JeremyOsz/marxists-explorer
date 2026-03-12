import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, 'public', 'data-v2');
const INDEX_PATH = path.join(DATA_DIR, 'index.json');
const MANIFEST_DIR = path.join(DATA_DIR, 'manifests');
const SEARCH_MANIFEST_PATH = path.join(MANIFEST_DIR, 'search-manifest.json');
const THINKER_MANIFEST_DIR = path.join(MANIFEST_DIR, 'thinkers');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function buildSearchText(entry) {
  return [
    entry.n,
    entry.c,
    entry.d,
    ...(entry.subjects ?? []).map((subject) => subject.name),
    ...(entry.j ?? []).map((work) => work.title),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function main() {
  const index = readJson(INDEX_PATH);
  const searchManifest = [];

  for (const category of index.categories) {
    const metadataPath = path.join(DATA_DIR, category.path, 'metadata.json');
    const metadata = readJson(metadataPath);

    for (const thinker of metadata) {
      const manifestEntry = {
        ...thinker,
        s: buildSearchText(thinker),
      };

      searchManifest.push(manifestEntry);

      const thinkerManifestPath = path.join(
        THINKER_MANIFEST_DIR,
        category.path,
        `${encodeURIComponent(thinker.n)}.json`
      );

      writeJson(thinkerManifestPath, manifestEntry);
    }
  }

  searchManifest.sort((a, b) => a.n.localeCompare(b.n));
  writeJson(SEARCH_MANIFEST_PATH, searchManifest);
}

main();
