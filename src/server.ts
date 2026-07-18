import dotenv from "dotenv";
dotenv.config();

import { connectDB, getMongoClientDb } from "./lib/db";
import { createAuth, setAuthInstance } from "./lib/auth";
import { createApp } from "./app";

async function main() {
  // 1. Connect Mongoose first — Better Auth reuses this same connection.
  await connectDB();

  // 2. Now that mongoose has a live client, build the Better Auth instance.
  const auth = createAuth(getMongoClientDb());
  setAuthInstance(auth);

  // 3. Build the Express app (routes reference the auth singleton internally).
  const app = createApp(auth);

  const startServer = (port: number) => {
    const server = app.listen(port, () => {
      console.log(`🚀 ScholarAI API running on http://localhost:${port}`);
    });

    server.on("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "EADDRINUSE") {
        console.warn(`Port ${port} is busy. Trying ${port + 1}...`);
        server.close(() => startServer(port + 1));
      } else {
        console.error("Failed to start server:", error);
        process.exit(1);
      }
    });
  };

  const PORT = Number(process.env.PORT) || 5000;
  startServer(PORT);
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
