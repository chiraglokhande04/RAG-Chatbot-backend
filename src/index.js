// backend/src/server.js
// import express from "express";
// import bodyParser from "body-parser";
// import chatRoutes from "./routes/chat.js";
// import dotenv from "dotenv";
// dotenv.config();

const express = require("express");
const bodyParser = require("body-parser");
const chatRoutes = require("./routes/chat.js");
require("dotenv").config();

const app = express();
app.use(bodyParser.json({ limit: "1mb" }));
app.use("/api", chatRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
