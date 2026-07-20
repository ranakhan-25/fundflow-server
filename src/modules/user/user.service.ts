import type { JWTPayload } from "jose";
import { userCollection } from "../../config/database.js";
import {
  ROLES,
  SIGNUP_CREDITS,
  type Role,
} from "../../config/constants.js";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/AppError.js";
import { toObjectId } from "../../utils/objectId.js";
import type { UserDoc } from "../../types/models.js";
import type { SyncUserInput } from "./user.validation.js";

type AuthPayload = JWTPayload & {
  email?: string;
  name?: string;
  image?: string;
};

// Creates the user profile the first time, granting signup credits exactly
// once. Subsequent calls simply return the existing profile (idempotent), so
// credits can never be granted twice.
export async function syncUser(
  auth: AuthPayload,
  input: SyncUserInput,
): Promise<{ user: UserDoc; created: boolean }> {
  const email = (input.email ?? auth.email)?.toLowerCase();
  if (!email) {
    throw new AppError(400, "Email could not be determined from the token.");
  }

  const existing = await userCollection.findOne({ email });
  if (existing) {
    return { user: existing, created: false };
  }

  const isAdmin = env.adminEmails.includes(email);
  const role: Role = isAdmin ? ROLES.ADMIN : input.role;

  const now = new Date();
  const doc: UserDoc = {
    name: input.name ?? auth.name ?? "Anonymous",
    email,
    photoURL: input.photoURL ?? auth.image ?? "",
    role,
    credits: SIGNUP_CREDITS[role] ?? 0,
    raisedCredits: 0,
    createdAt: now,
    updatedAt: now,
  };

  const result = await userCollection.insertOne(doc);
  return { user: { ...doc, _id: result.insertedId }, created: true };
}

export async function getUserByEmail(email: string): Promise<UserDoc | null> {
  return userCollection.findOne({ email: email.toLowerCase() });
}

export async function listUsers(): Promise<UserDoc[]> {
  return userCollection.find().sort({ createdAt: -1 }).toArray();
}

export async function updateUserRole(
  id: string,
  role: Role,
): Promise<UserDoc> {
  const _id = toObjectId(id);
  const result = await userCollection.findOneAndUpdate(
    { _id },
    { $set: { role, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  if (!result) {
    throw new AppError(404, "User not found.");
  }
  return result;
}

export async function deleteUser(id: string): Promise<void> {
  const _id = toObjectId(id);
  const result = await userCollection.deleteOne({ _id });
  if (result.deletedCount === 0) {
    throw new AppError(404, "User not found.");
  }
}
