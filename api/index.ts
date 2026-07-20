import dotenv from "dotenv";
dotenv.config();

import type { IncomingMessage, ServerResponse } from "http";
import { connectDB, getMongoClientDb } from "../src/lib/db";
import { createAuth, setAuthInstance } from "../src/lib/auth";
import { createApp } from "../src/app";
import type { Express } from "express";

// Vercel reuses "warm" serverless instances between requests. Caching the
// built app on the module scope means we only connect to Mongo and build
// Better Auth ONCE per warm instance, instead of on every single request.
let appPromise: Promise<Express> | null = null;

async function getApp(): Promise<Express> {
  if (!appPromise) {
    appPromise = (async () => {
      await connectDB();
      const auth = createAuth(getMongoClientDb());
      setAuthInstance(auth);
      return createApp(auth);
    })();
  }
  return appPromise;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const app = await getApp();
  (app as any)(req, res);
}