// backend/src/server.js
// import express from "express";
// import bodyParser from "body-parser";
// import chatRoutes from "./routes/chat.js";
// import dotenv from "dotenv";
// dotenv.config();

const express = require("express");
const bodyParser = require("body-parser");
const chatRoutes = require("./routes/chat.js");
const cors = require("cors");
require("dotenv").config();




const app = express();

app.use(cors({
  origin: "http://localhost:5173", // or "*" to allow all
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(bodyParser.json({ limit: "1mb" }));
app.use("/api", chatRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
