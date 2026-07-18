import { Request, Response, NextFunction } from "express";

// Centralized error handler — every asyncHandler-wrapped controller funnels
// its errors here instead of leaking stack traces to the client.
export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  console.error(err);

  if (err.message?.includes("Only PDF files are allowed")) {
    return res.status(400).json({ message: err.message });
  }

  const status = err.status || 500;
  res.status(status).json({
    message: err.message || "Something went wrong on the server",
  });
}
