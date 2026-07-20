import "dotenv/config";
import app from "./app.js";

const PORT = process.env.PORT || 5000;

// Vercel runs the exported `app` as a serverless handler, so only start a
// long-running listener when we're NOT on Vercel (e.g. local dev / self-host).
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
  });
}

export default app;
