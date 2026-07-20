import express from "express";
import cors from "cors";
import paperRoutes from "./routes/paper.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { getAuthInstance, createAuth, setAuthInstance } from "./lib/auth.js";
import { connectDB, getMongoClientDb } from "./lib/db.js";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

app.all("/api/auth/*", async (req, res) => {
  try {
    let auth;
    try {
      auth = getAuthInstance();
    } catch {
      await connectDB();
      const newAuth = await createAuth(getMongoClientDb());
      setAuthInstance(newAuth);
      auth = newAuth;
    }

    const { toNodeHandler } = await import("better-auth/node");
    const handler = toNodeHandler(auth);
    return handler(req, res);
  } catch (err) {
    console.error("Auth handler initialization failed:", err);
    return res.status(503).json({ message: "Auth not initialized" });
  }
});

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", message: "ScholarAI API is running" });
});

app.use("/api/papers", paperRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/chat", chatRoutes);

app.use(errorHandler);

export default app;