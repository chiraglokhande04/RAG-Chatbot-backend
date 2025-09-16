// backend/scripts/testSearchChroma.js
const { getEmbedding } = require("../src/services/getEmbedding.js"); // your OpenAI embedding service
const { queryCollection } = require("../src/services/chroma.js");

const COLLECTION_NAME = process.env.CHROMA_COLLECTION || "news_chunks";

async function run(query, topK = 5) {
  console.log("Embedding query:", query);
  const qVec = await getEmbedding(query);
  const res = await queryCollection(COLLECTION_NAME, qVec, topK);

  for (let i = 0; i < res.ids.length; i++) {
    console.log(`\n[${i + 1}] id=${res.ids[i]} distance=${res.distances[i]}`);
    console.log(" title:", res.metadatas[i]?.title);
    console.log(" url:", res.metadatas[i]?.url);
    console.log(
      " preview:",
      (res.documents[i] || "").slice(0, 300).replace(/\n/g, " "),
      "..."
    );
  }
}

const q = process.argv.slice(2).join(" ") || "latest technology acquisitions";
run(q).catch((e) => {
  console.error(e);
  process.exit(1);
});
