import mongoose from "mongoose";
import type { Schema as MongooseSchema } from "mongoose";

const { Schema, model, models } = mongoose;

// Better Auth manages the "user" collection via the raw MongoDB driver, not
// Mongoose — so Mongoose never registers a model for it, and any
// `.populate("uploadedBy")` call on Paper fails with a MissingSchemaError.
// This model exists purely so populate() has something to resolve against;
// it is never used to create/update users (Better Auth owns that).
const userSchema = new Schema(
  {
    name: String,
    email: String,
    role: String,
  },
  { collection: "user", strict: false }
);

export const User = (models as any).User || model("User", userSchema);