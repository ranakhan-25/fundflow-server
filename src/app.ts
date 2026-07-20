import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { connectToDatabase } from "./config/database.js";
import apiRoutes from "./routes/index.js";
import { notFound } from "./middleware/notFound.js";
import { globalErrorHandler } from "./middleware/globalErrorHandler.js";

const app = express();

app.use(
  cors({
    origin: env.clientOrigins.length > 0 ? env.clientOrigins : true,
    credentials: true,
  }),
);
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "FundFlow API is running 🚀",
    docs: "/api",
  });
});

app.get("/health", (_req, res) => {
  res.json({ success: true, status: "ok", time: new Date().toISOString() });
});

// Ensure the database connection is established (and cached) before any API
// request touches a collection. Memoized, so it's cheap on warm invocations.
app.use("/api", async (_req, _res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    next(error);
  }
});

app.use("/api", apiRoutes);

app.use(notFound);
app.use(globalErrorHandler);

export default app;
