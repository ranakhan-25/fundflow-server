import { notificationCollection } from "../../config/database.js";
import { toObjectId } from "../../utils/objectId.js";
import type { NotificationDoc } from "../../types/models.js";

export async function getMyNotifications(
  email: string,
): Promise<NotificationDoc[]> {
  return notificationCollection
    .find({ toEmail: email.toLowerCase() })
    .sort({ time: -1 })
    .toArray();
}

export async function getUnreadCount(email: string): Promise<number> {
  return notificationCollection.countDocuments({
    toEmail: email.toLowerCase(),
    read: false,
  });
}

export async function markAsRead(id: string, email: string): Promise<void> {
  await notificationCollection.updateOne(
    { _id: toObjectId(id), toEmail: email.toLowerCase() },
    { $set: { read: true } },
  );
}

export async function markAllAsRead(email: string): Promise<number> {
  const result = await notificationCollection.updateMany(
    { toEmail: email.toLowerCase(), read: false },
    { $set: { read: true } },
  );
  return result.modifiedCount;
}
