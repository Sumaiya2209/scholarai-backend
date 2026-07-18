import express, { Express } from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import type { Auth } from "./lib/auth";
import paperRoutes from "./routes/paper.routes";
import adminRoutes from "./routes/admin.routes";
import chatRoutes from "./routes/chat.routes";
import { errorHandler } from "./middleware/errorHandler";

export function createApp(auth: Auth): Express {
  const app = express();

  app.use(
    cors({
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      credentials: true,
    })
  );

  // IMPORTANT: Better Auth's handler must be mounted BEFORE express.json().
  // It needs to read the raw request body itself; if express.json() runs
  // first, the body stream is already consumed and auth breaks.
  app.all("/api/auth/*", toNodeHandler(auth));

  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", message: "ScholarAI API is running" });
  });

  app.use("/api/papers", paperRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/chat", chatRoutes);

  app.use(errorHandler);

  return app;
}
