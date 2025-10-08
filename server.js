// server.js
process.env.NODE_OPTIONS = "--openssl-legacy-provider"; // 🛠 Fix for OpenSSL TLS issue on Render

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

app.set("trust proxy", 1); // ✅ required on Render for secure cookies
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

let db, collection;

// ✅ Robust MongoDB connection with SSL fallback
async function connectDB() {
  try {
    const client = new MongoClient(process.env.MONGO_URI, {
      ssl: true,
      sslValidate: true,
      minTLSVersion: "TLS1_2",
      serverSelectionTimeoutMS: 10000,
    });

    await client.connect();
    console.log("✅ MongoDB connected successfully");

    db = client.db("bucketbuddy");
    collection = db.collection("items");

    // ✅ Initialize session store after Mongo is connected
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
          secure: process.env.NODE_ENV === "production", // only secure on https
          maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
        },
      })
    );

    setupAuthRoutes();
    startServer();
  } catch (err) {
    console.error("❌ Mongo connection failed:", err);
  }
}

// ✅ GitHub Authentication Setup
function setupAuthRoutes() {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: process.env.CALLBACK_URL,
      },
      (accessToken, refreshToken, profile, done) => {
        const user = { id: profile.id, username: profile.username };
        return done(null, user);
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((user, done) => done(null, user));

  app.use(passport.initialize());
  app.use(passport.session());

  // Landing routes
  app.get("/", (req, res) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
      res.redirect("/results.html");
    } else {
      res.redirect("/login.html");
    }
  });

  app.get("/auth/github", passport.authenticate("github", { scope: ["user:email"] }));

  app.get(
    "/auth/github/callback",
    passport.authenticate("github", { failureRedirect: "/login.html" }),
    (req, res) => {
      res.redirect("/results.html");
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

  app.get("/me", (req, res) => {
    res.json({ user: req.user || null });
  });

  // Middleware for protected routes
  function ensureLoggedIn(req, res, next) {
    if (req.isAuthenticated && req.isAuthenticated()) return next();
    res.status(401).send("login first bro");
  }

  // Routes
  app.get("/ping", (req, res) => res.send("pong"));

  app.get("/results", ensureLoggedIn, async (req, res) => {
    try {
      const items = await collection.find({ userId: req.user.id }).toArray();
      res.json(items);
    } catch (err) {
      res.status(500).send("cant get items: " + err);
    }
  });

  app.post("/results", ensureLoggedIn, async (req, res) => {
    try {
      const { title, category, priority, targetDate } = req.body;
      if (!title || !category || !priority) {
        return res.status(400).send("missing stuff");
      }
      const newItem = {
        userId: req.user.id,
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
      res.status(500).send("cant add item: " + err);
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
        return res.status(404).send("not found");
      }
      res.send("done!");
    } catch (err) {
      res.status(500).send("cant update: " + err);
    }
  });

  app.delete("/results/:id", ensureLoggedIn, async (req, res) => {
    try {
      const { id } = req.params;
      const result = await collection.deleteOne({
        _id: new ObjectId(id),
        userId: req.user.id,
      });
      if (result.deletedCount === 0) {
        return res.status(404).send("not found");
      }
      res.send("deleted");
    } catch (err) {
      res.status(500).send("cant delete: " + err);
    }
  });
}

// ✅ Start server only after DB connects
function startServer() {
  app.listen(port, () => console.log(`🚀 Server live @ http://localhost:${port}`));
}

connectDB();
