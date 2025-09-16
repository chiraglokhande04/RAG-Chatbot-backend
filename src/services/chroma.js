require("dotenv").config();

let client = null;
let ChromaClient = null;
const { CloudClient } = require("chromadb");

// Dynamically import the ESM module
async function ensureClientClass() {
    if (ChromaClient) return;
    const chromaMod = await import("chromadb").catch(err => {
        throw new Error("Failed to import chromadb: " + (err?.message || err));
    });

    ChromaClient = chromaMod?.default?.ChromaClient || chromaMod?.ChromaClient || chromaMod?.default || chromaMod;
    if (!ChromaClient || typeof ChromaClient !== "function") {
        throw new Error("Could not find ChromaClient in chromadb module");
    }
}

// Always async now
async function getClient() {
    if (client) return client;
    await ensureClientClass();

    // client = new ChromaClient({
    //     host: process.env.CHROMA_HOST,   // e.g. "db.trychroma.com"
    //     port: process.env.CHROMA_PORT,   // usually 443 for cloud
    //     ssl: true,
    //     tenant: process.env.CHROMA_TENANT,
    //     apiKey: process.env.CHROMA_API_KEY,
    // });


    client = new CloudClient({
        apiKey: process.env.CHROMA_API_KEY,
        tenant: process.env.CHROMA_TENANT,
        database: process.env.CHROMA_DATABASE
    });

    console.log("Chroma client instantiated:", !!client);
    return client;
}

async function getOrCreateCollection(name) {
    const c = await getClient();
    try {
        return await c.createCollection({ name });
    } catch (err) {
        // fallback if collection already exists
        try {
            return await c.getCollection({ name });
        } catch (e) {
            throw new Error("Failed create/get collection: " + (e?.message || e));
        }
    }
}

async function addPoints(collectionName, items) {
    const collection = await getOrCreateCollection(collectionName);

    const ids = items.map(it => it.id);
    const embeddings = items.map(it => it.embedding);
    const metadatas = items.map(it => it.metadata || {});
    const documents = items.map(it => it.document || "");

    await collection.add({ ids, embeddings, metadatas, documents });
}

// async function queryCollection(collectionName, queryEmbedding, topK = 5) {
//     const collection = await getOrCreateCollection(collectionName);
//     const res = await collection.query({
//         queryEmbeddings: [queryEmbedding],
//         nResults: topK,
//         include: ["metadatas", "documents", "distances", "ids"],
//     });

//     return {
//         ids: res.ids?.[0] || [],
//         distances: res.distances?.[0] || [],
//         metadatas: res.metadatas?.[0] || [],
//         documents: res.documents?.[0] || [],
//     };
// }

async function queryCollection(collectionName, queryEmbedding, topK = 5) {
    const collection = await getOrCreateCollection(collectionName);
    const res = await collection.query({
        queryEmbeddings: [queryEmbedding],
        nResults: topK,
        include: ["metadatas", "documents", "distances"], // remove "ids"
    });

    const idx = 0; // because we only passed one query vector
    return {
        ids: res.ids?.[idx] || [],             // ids are returned automatically
        distances: res.distances?.[idx] || [],
        metadatas: res.metadatas?.[idx] || [],
        documents: res.documents?.[idx] || [],
    };
}


module.exports = {
    getClient,
    getOrCreateCollection,
    addPoints,
    queryCollection,
};
