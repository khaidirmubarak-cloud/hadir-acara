import { z } from "zod";

// Longgar sengaja: format NIM pasti UIN Palopo belum dikonfirmasi. Cukup filter
// junk/karakter aneh sebelum membebani API Sevima dengan request yang jelas invalid.
export const nimSchema = z
  .string()
  .trim()
  .regex(/^\d{6,20}$/, "NIM harus berupa angka (6-20 digit)");

export const kehadiranLookupSchema = z.object({
  nim: nimSchema,
});
