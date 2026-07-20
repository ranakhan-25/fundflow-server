import { notificationCollection } from "../config/database.js";

interface NotifyInput {
  message: string;
  toEmail: string;
  actionRoute: string;
}

// Central helper so every module creates notifications in the exact shape
// required by the spec: { message, toEmail, actionRoute, time }.
export async function createNotification(input: NotifyInput): Promise<void> {
  await notificationCollection.insertOne({
    message: input.message,
    toEmail: input.toEmail.toLowerCase(),
    actionRoute: input.actionRoute,
    read: false,
    time: new Date(),
  });
}
