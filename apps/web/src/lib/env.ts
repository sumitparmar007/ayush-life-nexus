/**
 * Environment validation — import this at the top of server-side entry points.
 * Throws at startup if required variables are absent so the missing-config
 * bug surfaces immediately, not at first request.
 */

const required = ["JWT_SECRET"] as const;

export function validateEnv(): void {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}\n` +
        `Copy .env.example to .env.local and fill in the values.`
    );
  }
}

export const env = {
  get JWT_SECRET(): string {
    const val = process.env["JWT_SECRET"];
    if (!val) throw new Error("JWT_SECRET is not set");
    return val;
  },
  NODE_ENV: process.env["NODE_ENV"] as "development" | "production" | "test",
  isDev: process.env["NODE_ENV"] === "development",
  isProd: process.env["NODE_ENV"] === "production",
} as const;
