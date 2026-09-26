import { z } from "zod";

// Longgar sengaja: format NIM/NIP pasti UIN Palopo belum dikonfirmasi. Cukup filter
// junk/karakter aneh sebelum membebani API Sevima dengan request yang jelas invalid.
// Dipakai untuk NIM (mahasiswa) maupun NIP (pegawai/dosen) — polanya sama.
export const identitasSchema = z
  .string()
  .trim()
  .regex(/^\d{6,20}$/, "Harus berupa angka (6-20 digit)");

export const nimSchema = identitasSchema;

export const tipePesertaSchema = z.enum(["mahasiswa", "pegawai", "tamu"]).default("mahasiswa");

// Tamu (bukan sivitas akademika, tidak terdaftar di Sevima) mengisi nama sendiri —
// tidak ada sumber eksternal untuk verifikasi, jadi data ini murni self-reported.
export const namaTamuSchema = z.string().trim().min(3, "Nama minimal 3 karakter").max(150, "Nama maksimal 150 karakter");
export const instansiTamuSchema = z.string().trim().max(150, "Instansi maksimal 150 karakter").optional().or(z.literal(""));

// `nim`/`nama`/`instansi` semuanya opsional di level objek — kewajibannya bergantung
// pada `tipe`, diperiksa lewat superRefine supaya satu schema saja yang dipakai baik
// untuk mahasiswa/pegawai (butuh nim) maupun tamu (butuh nama, instansi opsional).
function validateIdentitasByTipe(
  data: { tipe: "mahasiswa" | "pegawai" | "tamu"; nim?: string; nama?: string },
  ctx: z.RefinementCtx,
) {
  if (data.tipe === "tamu") {
    if (!data.nama) {
      ctx.addIssue({ code: "custom", message: "Nama wajib diisi", path: ["nama"] });
    }
  } else if (!data.nim) {
    ctx.addIssue({ code: "custom", message: "NIM/NIP wajib diisi", path: ["nim"] });
  }
}

export const kehadiranLookupSchema = z
  .object({
    tipe: tipePesertaSchema,
    nim: identitasSchema.optional(),
    nama: namaTamuSchema.optional(),
    instansi: instansiTamuSchema,
  })
  .superRefine(validateIdentitasByTipe);

export const jawabanKuisionerSchema = z.object({
  pertanyaanId: z.string().uuid(),
  jawaban: z.string().trim().min(1, "Jawaban wajib diisi").max(1000, "Jawaban maksimal 1000 karakter"),
});

export const kehadiranConfirmSchema = z
  .object({
    tipe: tipePesertaSchema,
    nim: identitasSchema.optional(),
    nama: namaTamuSchema.optional(),
    instansi: instansiTamuSchema,
    jawaban: z.array(jawabanKuisionerSchema).max(10),
  })
  .superRefine(validateIdentitasByTipe);
