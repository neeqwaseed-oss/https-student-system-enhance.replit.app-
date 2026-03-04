import express from "express";
import session from "express-session";
import { createServer } from "http";
import { registerRoutes } from "./routes";
import { storage } from "./storage";
import connectPgSimple from "connect-pg-simple";
import pg from "pg";
import MemoryStore from "memorystore";

const { Pool } = pg;
const PgSession = connectPgSimple(session);
const SessionStore = MemoryStore(session);

const app = express();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const isProd = process.env.NODE_ENV === "production";
app.set("trust proxy", 1);

// Use MemoryStore if DATABASE_URL is missing
const sessionStore = process.env.DATABASE_URL 
  ? new PgSession({ pool, tableName: "session", createTableIfMissing: true })
  : new SessionStore({ checkPeriod: 86400000 });

app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || "student-mgmt-secret-key-2026",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  },
}));

// Health check responds immediately — before any async setup
app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

// In production: serve static files immediately so health checks on "/" pass
if (isProd) {
  (async () => {
    const path = (await import("path")).default;
    const { fileURLToPath } = await import("url");
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const distPath = path.resolve(__dirname, "../dist/public");
    app.use(express.static(distPath));
  })();
}

const server = createServer(app);
const port = Number(process.env.PORT) || 5000;

// Start listening immediately so health checks pass
server.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${port}`);
});

// Async setup runs after server is already accepting connections
(async () => {
  try { await storage.seedData(); console.log("✅ Data seeded"); } catch (e) { console.log("Seed skipped:", e); }

  try {
    const allTeachers = await storage.getTeachers();
    for (const teacher of allTeachers) {
      await storage.syncTeacherUserAccount(teacher);
    }
    console.log("✅ Teacher accounts synced");
  } catch (e) { console.log("Teacher sync skipped:", e); }

  await registerRoutes(server, app);

  if (isProd) {
    // SPA fallback — after API routes are registered
    const path = (await import("path")).default;
    const { fileURLToPath } = await import("url");
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const distPath = path.resolve(__dirname, "../dist/public");
    app.use((_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    const { setupFrontend } = await import("./setup");
    await setupFrontend(app, server);
  }

  console.log("✅ All routes registered");
})();
