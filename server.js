// server.js
const express = require("express");
const path = require("path");
const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

let collection;

// Connect to MongoDB
const client = new MongoClient(process.env.MONGO_URI);

client.connect()
  .then(() => {
    const db = client.db("bucketbuddy"); // match the DB name in your URI
    collection = db.collection("items");
    console.log("✅ Connected to MongoDB (bucketbuddy DB)");
  })
  .catch(err => {
    console.error("❌ MongoDB connection failed:", err);
  });

// --- Test routes ---
app.get("/ping", (req, res) => res.send("pong"));

app.get("/testdb", async (req, res) => {
  try {
    const testDoc = { title: "Hello MongoDB", createdAt: new Date() };
    await collection.insertOne(testDoc);
    const docs = await collection.find({}).toArray();
    res.json(docs);
  } catch (err) {
    res.status(500).send("DB test failed: " + err);
  }
});

// --- Future: bucket buddy routes (GET/POST/PUT/DELETE) go here ---

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
