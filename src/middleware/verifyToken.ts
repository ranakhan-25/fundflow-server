import type { NextFunction, Request, Response } from "express";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { env } from "../config/env.js";
import { userCollection } from "../config/database.js";
import { AppError } from "../utils/AppError.js";

// The client auth server (e.g. better-auth) publishes its public keys here.
const JWKS = createRemoteJWKSet(new URL(`${env.jwksUrl}/api/auth/jwks`));

// Verifies the bearer token and, when possible, attaches the matching
// application user profile. Does NOT fail if the profile has not been synced
// yet (that is what the "sync" endpoint is for).
export async function verifyToken(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError(401, "Unauthorized access. Bearer token required.");
    }

    const token = authHeader.split(" ")[1] as string;
    const { payload } = await jwtVerify(token, JWKS);

    req.auth = payload as Request["auth"];

    const email = (payload as { email?: string }).email;
    if (email) {
      const user = await userCollection.findOne({
        email: email.toLowerCase(),
      });
      if (user) {
        req.user = user as Request["user"];
      }
    }

    next();
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    next(new AppError(401, "Invalid or expired token."));
  }
}
