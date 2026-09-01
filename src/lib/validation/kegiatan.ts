import { z } from "zod";

export const kegiatanInputSchema = z
  .object({
    nama: z.string().trim().min(3, "Nama kegiatan minimal 3 karakter").max(200),
    deskripsi: z.string().trim().max(2000).optional().or(z.literal("")),
    lokasi: z.string().trim().min(3, "Lokasi minimal 3 karakter").max(200),
    // Value dari <input type="datetime-local">, mis. "2026-09-10T08:00"
    waktuMulai: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Format waktu mulai tidak valid"),
    waktuSelesai: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Format waktu selesai tidak valid"),
  })
  .refine((data) => data.waktuSelesai > data.waktuMulai, {
    message: "Waktu selesai harus setelah waktu mulai",
    path: ["waktuSelesai"],
  });

export type KegiatanInput = z.infer<typeof kegiatanInputSchema>;
