import "dotenv/config"; 
import { MongoClient, ServerApiVersion } from "mongodb";

const uri = process.env.DB_URL as string;

if (!uri) {
  throw new Error("DB_URL is missing");
}

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const db = client.db("Crowdfunding");
const userCollection = db.collection("user");
const companyCollection = db.collection("company");

export { client, db, userCollection, companyCollection };
