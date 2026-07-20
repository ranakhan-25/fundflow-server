import "express";
import type { JWTPayload } from "jose";
import type { UserDoc } from "../models.js";

declare global {
  namespace Express {
    interface Request {
      // Raw verified JWT payload from the auth provider (via JWKS).
      auth?: JWTPayload & { email?: string; name?: string; image?: string };
      // The application user profile loaded from our own database.
      user?: UserDoc & { _id: import("mongodb").ObjectId };
    }
  }
}

export {};
