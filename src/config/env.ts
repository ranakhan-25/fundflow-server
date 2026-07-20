import "dotenv/config";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === "") {
    throw new Error(`Environment variable "${name}" is missing`);
  }
  return value;
}

function optional(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}

export const env = {
  nodeEnv: optional("NODE_ENV", "development"),
  isProduction: optional("NODE_ENV", "development") === "production",
  port: Number(optional("PORT", "5000")),

  dbUrl: required("DB_URL"),
  dbName: optional("DB_NAME", "Crowdfunding"),

  // Base URL of the client's auth server that exposes a JWKS endpoint
  // (e.g. a better-auth / Next.js app at http://localhost:3000).
  jwksUrl: required("JWKS_URL"),

  // Comma separated list of emails that should be bootstrapped as admins
  // the first time they sync their profile.
  adminEmails: optional("ADMIN_EMAILS")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),

  // Client origin(s) allowed by CORS. Comma separated. Defaults to all.
  clientOrigins: optional("CLIENT_ORIGINS")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),

  clientUrl: optional("CLIENT_URL", "http://localhost:3000"),

  stripeSecretKey: optional("STRIPE_SECRET_KEY"),
  stripeWebhookSecret: optional("STRIPE_WEBHOOK_SECRET"),
};

export const isStripeEnabled = Boolean(env.stripeSecretKey);
