import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import { client } from "./config/database.js";
import companyRouter from "./router/companyRouter.js";
const app = express();
app.use(cors());
app.use(express.json());
app.use("/api", companyRouter);
async function run() {
    try {
        await client.connect();
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    }
    finally {
    }
}
run().catch(console.dir);
app.get("/", (req, res) => {
    res.send("Server is running...");
});
export default app;
//# sourceMappingURL=app.js.map