import { z } from "zod";

// `id` hadir hanya saat edit (pertanyaan yang sudah ada di DB) — dipakai server
// untuk membedakan update vs pertanyaan baru, dan melindungi pertanyaan yang
// sudah punya jawaban peserta dari terhapus tanpa sengaja.
export const pertanyaanInputSchema = z.object({
  id: z.string().uuid().optional(),
  teks: z.string().trim().min(3, "Pertanyaan minimal 3 karakter").max(300),
});

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
    pertanyaan: z.array(pertanyaanInputSchema).max(10, "Maksimal 10 pertanyaan kuisioner").default([]),
  })
  .refine((data) => data.waktuSelesai > data.waktuMulai, {
    message: "Waktu selesai harus setelah waktu mulai",
    path: ["waktuSelesai"],
  });

export type KegiatanInput = z.infer<typeof kegiatanInputSchema>;
export type PertanyaanInput = z.infer<typeof pertanyaanInputSchema>;
