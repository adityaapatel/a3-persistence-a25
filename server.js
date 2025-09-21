// server.js
const express = require("express");
const path = require("path");
const { MongoClient, ObjectId } = require("mongodb");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const passport = require("passport");
const GitHubStrategy = require("passport-github2").Strategy;
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

let db, collection;

// ----- MongoDB -----
const client = new MongoClient(process.env.MONGO_URI);
client.connect()
  .then(() => {
    db = client.db("bucketbuddy");
    collection = db.collection("items");
    console.log("✅ Connected to MongoDB (bucketbuddy DB)");
  })
  .catch(err => {
    console.error("❌ MongoDB connection failed:", err);
  });

// ----- Sessions -----
app.use(
  session({
    secret: process.env.SESSION_SECRET || "change-me",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      client,
      dbName: "bucketbuddy",
      collectionName: "sessions",
    }),
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
  })
);

// ----- Passport GitHub OAuth -----
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: "/auth/github/callback",
    },
    (accessToken, refreshToken, profile, done) => {
      // Keep user minimal
      const user = { id: profile.id, username: profile.username };
      return done(null, user);
    }
  )
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

app.use(passport.initialize());
app.use(passport.session());

// ----- Auth routes -----
app.get("/auth/github", passport.authenticate("github", { scope: ["user:email"] }));

app.get(
  "/auth/github/callback",
  passport.authenticate("github", { failureRedirect: "/login.html" }),
  (req, res) => {
    res.redirect("/results.html"); // redirect after login
  }
);

app.post("/logout", (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.redirect("/login.html");
    });
  });
});

// Debug: who am I
app.get("/me", (req, res) => {
  res.json({ user: req.user || null });
});

// ----- Middleware to require login -----
function ensureLoggedIn(req, res, next) {
  if (req.isAuthenticated && req.isAuthenticated()) return next();
  res.status(401).send("Not authorized. Please log in at /login.html");
}

// ----- Test route -----
app.get("/ping", (req, res) => res.send("pong"));

// ----- Bucket Buddy routes (now protected) -----
// OLD (unprotected):
// app.get("/results", async (req, res) => { ... })
// app.post("/results", async (req, res) => { ... })
// app.put("/results/:id", async (req, res) => { ... })
// app.delete("/results/:id", async (req, res) => { ... })
// --- REMOVED these and replaced with below, all guarded by ensureLoggedIn ---

app.get("/results", ensureLoggedIn, async (req, res) => {
  try {
    const items = await collection.find({ userId: req.user.id }).toArray();
    res.json(items);
  } catch (err) {
    res.status(500).send("Failed to fetch items: " + err);
  }
});

app.post("/results", ensureLoggedIn, async (req, res) => {
  try {
    const { title, category, priority, targetDate } = req.body;
    if (!title || !category || !priority) {
      return res.status(400).send("Missing required fields");
    }
    const newItem = {
      userId: req.user.id, // ✅ tie to GitHub user
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

app.put("/results/:id", ensureLoggedIn, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await collection.updateOne(
      { _id: new ObjectId(id), userId: req.user.id },
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

app.delete("/results/:id", ensureLoggedIn, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await collection.deleteOne({ _id: new ObjectId(id), userId: req.user.id });
    if (result.deletedCount === 0) {
      return res.status(404).send("Item not found");
    }
    res.send("Deleted");
  } catch (err) {
    res.status(500).send("Failed to delete item: " + err);
  }
});

// ----- Start server -----
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
