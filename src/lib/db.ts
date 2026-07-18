import mongoose from "mongoose";

let isConnected = false;

export async function connectDB(): Promise<void> {
  if (isConnected) return;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is missing in .env");
  }

  try {
    await mongoose.connect(uri);
    isConnected = true;
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  }
}

// Better Auth needs the raw mongodb driver Db instance.
// Mongoose keeps the underlying MongoClient, so we reuse the SAME connection
// instead of opening a second one.
export function getMongoClientDb() {
  const client = mongoose.connection.getClient();
  return client.db();
}
