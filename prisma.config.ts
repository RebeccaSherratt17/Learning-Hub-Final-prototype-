import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Load .env.local first (same file Next.js uses), fall back to .env
config({ path: ".env.local" });
config({ path: ".env" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    // DIRECT_URL bypasses the connection pooler — required for migrations
    // Falls back to DATABASE_URL if DIRECT_URL is not set
    url: process.env["DIRECT_URL"] || process.env["DATABASE_URL"],
  },
});
