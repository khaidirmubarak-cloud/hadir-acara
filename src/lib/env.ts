import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL wajib diisi"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  APP_URL: z.string().default("http://localhost:3000"),

  SESSION_SECRET: z.string().min(16, "SESSION_SECRET minimal 16 karakter"),
  SESSION_DURATION_HOURS: z.coerce.number().default(12),

  ADMIN_USERNAME: z.string().default("admin"),
  ADMIN_PASSWORD: z.string().default(""),

  SEVIMA_BASE_URL: z.string().default("https://siakadcloud.sevima.com"),
  SEVIMA_APP_KEY: z.string().default(""),
  SEVIMA_SECRET_KEY: z.string().default(""),
  SEVIMA_TIMEOUT_MS: z.coerce.number().default(8000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(
    `Konfigurasi environment tidak valid: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`,
  );
}

export const env = parsed.data;
