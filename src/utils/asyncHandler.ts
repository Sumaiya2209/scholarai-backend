import { Request, Response, NextFunction, RequestHandler } from "express";

// Wraps async controllers so thrown errors go to Express's error handler
// instead of crashing the process or needing try/catch in every controller.
export function asyncHandler(fn: RequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
