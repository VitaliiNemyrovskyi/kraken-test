import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  GOOGLE_CLIENT_ID: z.string().default(""),
  GOOGLE_CLIENT_SECRET: z.string().default(""),
  GOOGLE_REDIRECT_URI: z.string().url().default("http://localhost:3001/auth/google/callback"),
  SHEET_ID: z.string().default(""),
  SHEET_RANGE: z.string().default("Sheet1!A:H"),
  POLL_INTERVAL_SECONDS: z.coerce.number().int().min(10).default(60),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  HOST: z.string().default("127.0.0.1"),
  DATABASE_PATH: z.string().default("./data/intake.db"),
});

export const config = schema.parse(process.env);

export const hasGoogleCreds =
  config.GOOGLE_CLIENT_ID.length > 0 && config.GOOGLE_CLIENT_SECRET.length > 0;
