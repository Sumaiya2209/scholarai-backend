import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import type { Db } from "mongodb";

// We create Better Auth AFTER mongoose connects (see server.ts), because it
// needs the raw MongoDB `Db` instance, not a mongoose connection.
export function createAuth(db: Db) {
  return betterAuth({
    // The installed Better Auth Mongo adapter only accepts the db instance
    // and optional adapter config; the database name is taken from the db.
    database: mongodbAdapter(db),

    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,

    trustedOrigins: [process.env.CLIENT_URL || "http://localhost:3000"],

    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
    },

    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      },
    },

    // Custom field on the User table: role -> "user" | "admin"
    // Every new signup defaults to "user". You'll manually flip one
    // account to "admin" directly in MongoDB (see README).
    user: {
      additionalFields: {
        role: {
          type: "string",
          defaultValue: "user",
          input: false, // prevents users from setting their own role via signup payload
        },
      },
    },

    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // refresh once per day
    },

    advanced: {
      defaultCookieAttributes: {
        sameSite: "none",
        secure: true,
      },
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;

// Simple singleton so middleware/controllers (loaded before Mongo connects)
// can still access the auth instance once it's ready.
let authInstance: Auth | null = null;

export function setAuthInstance(instance: Auth) {
  authInstance = instance;
}

export function getAuthInstance(): Auth {
  if (!authInstance) {
    throw new Error("Auth not initialized yet — connectDB() must run first");
  }
  return authInstance;
}
