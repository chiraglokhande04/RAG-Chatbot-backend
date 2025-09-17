// backend/src/routes/chat.js
// import express from "express";
// import { v4 as uuidv4 } from "uuid";
// import { getEmbedding } from "../services/embeddings.js";
// import { queryCollection } from "../services/chroma.js";
// import { buildPrompt } from "../utils/promptBuilder.js";
// import { generateAnswer } from "../services/gemini.js";
// import redisClient from "../services/redisClient.js";

const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { getEmbedding } = require("../services/getEmbedding.js");
const { queryCollection } = require("../services/chroma.js");
const { buildPrompt } = require("../utils/promptBuilder.js");
const { generateAnswer } = require("../services/gemini.js");
const redisClient = require("../services/redisClient.js");

const router = express.Router();
const CHROMA_COLLECTION = process.env.CHROMA_COLLECTION || "news_chunks";
const RETRIEVE_K = parseInt(process.env.RETRIEVE_K || "5", 10);
const HISTORY_TTL_SECONDS = parseInt(process.env.SESSION_TTL_SECONDS || String(60 * 60 * 24 * 7), 10); // default 7 days

// Create new session
router.post("/session", async (req, res) => {
  try {
    const sessionId = uuidv4();
    // initialize empty history list in Redis
    await redisClient.del(`session:${sessionId}:history`);
    // set TTL so sessions expire automatically
    await redisClient.expire(`session:${sessionId}:history`, HISTORY_TTL_SECONDS);
    res.json({ sessionId });
  } catch (err) {
    console.error("session create error:", err);
    res.status(500).json({ error: "Failed to create session" });
  }
});

// Get session history
router.get("/session/:sessionId/history", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const key = `session:${sessionId}:history`;
    // Return list of JSON strings -> parse
    const raw = await redisClient.lrange(key, 0, -1);
    const history = raw.map((r) => {
      try { return JSON.parse(r); } catch (_) { return r; }
    }).reverse(); // newest last -> return chronological
    res.json({ history });
  } catch (err) {
    console.error("get history error:", err);
    res.status(500).json({ error: "Failed to get history" });
  }
});

// Clear session history
router.post("/session/:sessionId/clear", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const key = `session:${sessionId}:history`;
    await redisClient.del(key);
    res.json({ ok: true });
  } catch (err) {
    console.error("clear history error:", err);
    res.status(500).json({ error: "Failed to clear history" });
  }
});

// Main chat endpoint
// body: { sessionId, message }
router.post("/chat", async (req, res) => {
  try {
    const { sessionId, message } = req.body;
    if (!sessionId || !message) return res.status(400).json({ error: "sessionId and message required" });

    // 1) append user message to session history (optimistic)
    const key = `session:${sessionId}:history`;
    const userTurn = { role: "user", text: message, ts: Date.now() };
    await redisClient.rpush(key, JSON.stringify(userTurn));
    await redisClient.expire(key, HISTORY_TTL_SECONDS);

    // 2) embed the query
    const qVec = await getEmbedding(message);
    if (!qVec) throw new Error("Failed to embed query");

    // 3) retrieve top-k chunks from Chroma
    const searchRes = await queryCollection(CHROMA_COLLECTION, qVec, RETRIEVE_K);
    // searchRes: { ids, distances, metadatas, documents }
    const contexts = (searchRes.documents || []).map((doc, i) => ({
      id: searchRes.ids?.[i],
      score: searchRes.distances?.[i],
      metadata: searchRes.metadatas?.[i] || {},
      text: doc,
    }));

    // 4) get recent session history to provide conversational context (last N)
    const raw = await redisClient.lrange(key, -10, -1); // last up to 10 turns
    const recentHistory = raw.map((r) => {
      try { return JSON.parse(r); } catch (_) { return null; }
    }).filter(Boolean);

    // 5) build the prompt for the LLM using promptBuilder
    const prompt = buildPrompt({ question: message, contexts, history: recentHistory });

    // 6) call Gemini (or fallback LLM) to generate the answer
    const answer = await generateAnswer(prompt);

    // 7) append assistant turn to history
    const assistantTurn = { role: "assistant", text: answer, ts: Date.now(), sources: contexts.map(c => c.metadata?.url).filter(Boolean) };
    await redisClient.rpush(key, JSON.stringify(assistantTurn));
    await redisClient.expire(key, HISTORY_TTL_SECONDS);

    // 8) return answer + sources
    res.json({
      answer,
      sources: assistantTurn.sources,
      contexts: contexts.map((c) => ({ id: c.id, score: c.score, title: c.metadata?.title, url: c.metadata?.url })),
    });
  } catch (err) {
    console.error("chat error:", err);
    res.status(500).json({ error: "Chat failed", details: err.message?.slice(0, 300) });
  }
});

module.exports = router;
