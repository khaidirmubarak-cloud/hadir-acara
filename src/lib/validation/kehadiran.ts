import { z } from "zod";

// Longgar sengaja: format NIM/NIP pasti UIN Palopo belum dikonfirmasi. Cukup filter
// junk/karakter aneh sebelum membebani API Sevima dengan request yang jelas invalid.
// Dipakai untuk NIM (mahasiswa) maupun NIP (pegawai/dosen) — polanya sama.
export const identitasSchema = z
  .string()
  .trim()
  .regex(/^\d{6,20}$/, "Harus berupa angka (6-20 digit)");

export const nimSchema = identitasSchema;

export const tipePesertaSchema = z.enum(["mahasiswa", "pegawai"]).default("mahasiswa");

export const kehadiranLookupSchema = z.object({
  tipe: tipePesertaSchema,
  nim: identitasSchema,
});

export const jawabanKuisionerSchema = z.object({
  pertanyaanId: z.string().uuid(),
  jawaban: z.string().trim().min(1, "Jawaban wajib diisi").max(1000, "Jawaban maksimal 1000 karakter"),
});

export const kehadiranConfirmSchema = z.object({
  tipe: tipePesertaSchema,
  nim: identitasSchema,
  jawaban: z.array(jawabanKuisionerSchema).max(10),
});
