import "dotenv/config";
import { MongoClient } from "mongodb";
declare const client: MongoClient;
declare const db: import("mongodb").Db;
declare const userCollection: import("mongodb").Collection<import("bson").Document>;
declare const companyCollection: import("mongodb").Collection<import("bson").Document>;
export { client, db, userCollection, companyCollection };
//# sourceMappingURL=database.d.ts.map