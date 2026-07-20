import "dotenv/config";
import { client, connectToDatabase, userCollection } from "../config/database.js";
import { ROLES } from "../config/constants.js";

// Promotes an existing user to admin, or exits with guidance if not found.
// Usage: npm run seed:admin -- admin@example.com
async function main() {
  const email = process.argv[2]?.toLowerCase();
  if (!email) {
    console.error("Usage: npm run seed:admin -- <email>");
    process.exit(1);
  }

  await connectToDatabase();
  const result = await userCollection.findOneAndUpdate(
    { email },
    { $set: { role: ROLES.ADMIN, updatedAt: new Date() } },
    { returnDocument: "after" },
  );

  if (!result) {
    console.error(
      `No user found with email "${email}". The user must register first.`,
    );
    process.exit(1);
  }

  console.log(`✅ ${email} is now an admin.`);
  await client.close();
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
