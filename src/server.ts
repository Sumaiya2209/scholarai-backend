import dotenv from "dotenv";
dotenv.config();

import { connectDB, getMongoClientDb } from "./lib/db.js";
import { createAuth, setAuthInstance } from "./lib/auth.js";
import app from "./app.js";

async function main() {
  await connectDB();

  const auth = await createAuth(getMongoClientDb());
  setAuthInstance(auth);

  const PORT = Number(process.env.PORT) || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 ScholarAI API running on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});