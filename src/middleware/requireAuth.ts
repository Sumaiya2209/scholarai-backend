import { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { getAuthInstance } from "../lib/auth";

// Extend Express's Request type so controllers get typed access to req.user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        email: string;
        role: "user" | "admin";
      };
    }
  }
}

/**
 * Verifies the Better Auth session cookie on every protected route.
 * Attaches a trimmed-down `req.user` object for controllers to use.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const auth = getAuthInstance();
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      return res.status(401).json({ message: "Login required" });
    }

    req.user = {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: (session.user as any).role || "user",
    };

    next();
  } catch (err) {
    console.error("Auth check failed:", err);
    return res.status(401).json({ message: "Invalid or expired session" });
  }
}

/**
 * Use AFTER requireAuth. Blocks non-admin users from admin-only routes
 * like paper approval.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin access only" });
  }
  next();
}
