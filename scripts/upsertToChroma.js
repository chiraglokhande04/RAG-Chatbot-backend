const fs = require("fs-extra");
const path = require("path");
const { addPoints } = require("../src/services/chroma");


const COLLECTION_NAME = process.env.CHROMA_COLLECTION || "news_chunks";
const INPUT_FILE = path.resolve("news_embeddings_openai.jsonl");
const BATCH_SIZE = 64;


async function load() {
  if (!fs.existsSync(INPUT_FILE)) {
    console.error("Embeddings file not found:", INPUT_FILE);
    process.exit(1);
  }
  const lines = (await fs.readFile(INPUT_FILE, "utf8")).split("\n").filter(Boolean);
  return lines.map((l) => JSON.parse(l));
}

function toItem(obj) {
  return {
    id: obj.id, // keep original, or generate new if duplicates exist
    embedding: obj.embedding,
    metadata: {
      title: obj.title,
      url: obj.url,
      source: obj.sourceFeed,
    },
    document: obj.text,
  };
}

async function main() {
  const items = await load();
  console.log("Loaded items:", items.length);

  // Remove duplicates based on id
  const uniqueItemsMap = new Map();
  items.forEach((item) => {
    if (!uniqueItemsMap.has(item.id)) uniqueItemsMap.set(item.id, item);
  });
  const uniqueItems = Array.from(uniqueItemsMap.values());
  console.log("Unique items:", uniqueItems.length);

  for (let i = 0; i < uniqueItems.length; i += BATCH_SIZE) {
    const batch = uniqueItems.slice(i, i + BATCH_SIZE).map(toItem);
    console.log(`Adding batch ${i}..${i + batch.length - 1}`);
    await addPoints(COLLECTION_NAME, batch);
    await new Promise((r) => setTimeout(r, 100));
  }
  console.log("Upsert complete.");
}

main().catch((err) => { console.error(err); process.exit(1); });

