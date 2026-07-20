import { ObjectId } from "mongodb";
import { AppError } from "./AppError.js";

export function toObjectId(id: string): ObjectId {
  if (!ObjectId.isValid(id)) {
    throw new AppError(400, "Invalid id format.");
  }
  return new ObjectId(id);
}
