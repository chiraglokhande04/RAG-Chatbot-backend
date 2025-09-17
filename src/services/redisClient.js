// backend/src/services/redisClient.js
const Redis = require("ioredis");

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";
const client = new Redis(REDIS_URL);

client.on("error", (e) => console.error("Redis error", e));
client.on("connect", () => console.log("Redis connected"));

module.exports = client;