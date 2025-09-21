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
    const db = client.db("bucketbuddy"); // same as in your URI
    collection = db.collection("items");
    console.log("✅ Connected to MongoDB (bucketbuddy DB)");
  })
  .catch(err => {
    console.error("❌ MongoDB connection failed:", err);
  });

//  Test routes 
app.get("/ping", (req, res) => res.send("pong"));

// bucket Buddy routes
// Get all items
app.get("/results", async (req, res) => {
  try {
    const items = await collection.find({}).toArray();
    res.json(items);
  } catch (err) {
    res.status(500).send("Failed to fetch items: " + err);
  }
});

// add new item
app.post("/results", async (req, res) => {
  try {
    const { title, category, priority, targetDate } = req.body;
    if (!title || !category || !priority) {
      return res.status(400).send("Missing required fields");
    }
    const newItem = {
      title,
      category,
      priority,
      targetDate,
      addedAt: new Date(),
      completed: false,
    };
    const result = await collection.insertOne(newItem);
    res.json({ ...newItem, _id: result.insertedId });
  } catch (err) {
    res.status(500).send("Failed to add item: " + err);
  }
});

// mark a item copleted
app.put("/results/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { completed: true } }
    );
    if (result.modifiedCount === 0) {
      return res.status(404).send("Item not found");
    }
    res.send("Marked completed");
  } catch (err) {
    res.status(500).send("Failed to update item: " + err);
  }
});

// Delete item
app.delete("/results/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return res.status(404).send("Item not found");
    }
    res.send("Deleted");
  } catch (err) {
    res.status(500).send("Failed to delete item: " + err);
  }
});

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
