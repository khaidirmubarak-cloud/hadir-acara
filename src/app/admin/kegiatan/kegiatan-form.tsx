"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type PertanyaanFormValue = {
  id?: string;
  teks: string;
};

export type KegiatanFormValues = {
  nama: string;
  deskripsi: string;
  lokasi: string;
  waktuMulai: string;
  waktuSelesai: string;
  pertanyaan: PertanyaanFormValue[];
};

type Props = {
  mode: "create" | "edit";
  kegiatanId?: string;
  initialValues?: KegiatanFormValues;
};

const EMPTY: KegiatanFormValues = {
  nama: "",
  deskripsi: "",
  lokasi: "",
  waktuMulai: "",
  waktuSelesai: "",
  pertanyaan: [],
};

const MAX_PERTANYAAN = 10;

export default function KegiatanForm({ mode, kegiatanId, initialValues }: Props) {
  const router = useRouter();
  const [values, setValues] = useState<KegiatanFormValues>(initialValues ?? EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof KegiatanFormValues>(key: K, value: KegiatanFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function addPertanyaan() {
    setValues((prev) => ({ ...prev, pertanyaan: [...prev.pertanyaan, { teks: "" }] }));
  }

  function updatePertanyaan(index: number, teks: string) {
    setValues((prev) => ({
      ...prev,
      pertanyaan: prev.pertanyaan.map((p, i) => (i === index ? { ...p, teks } : p)),
    }));
  }

  function removePertanyaan(index: number) {
    setValues((prev) => ({ ...prev, pertanyaan: prev.pertanyaan.filter((_, i) => i !== index) }));
  }

  function validate(): string | null {
    if (!values.nama.trim()) return "Nama kegiatan wajib diisi";
    if (!values.lokasi.trim()) return "Lokasi wajib diisi";
    const datetimePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
    if (!datetimePattern.test(values.waktuMulai)) return "Waktu mulai belum lengkap — isi tanggal dan jam";
    if (!datetimePattern.test(values.waktuSelesai)) return "Waktu selesai belum lengkap — isi tanggal dan jam";
    if (values.waktuSelesai <= values.waktuMulai) return "Waktu selesai harus setelah waktu mulai";
    if (values.pertanyaan.some((p) => !p.teks.trim())) return "Pertanyaan kuisioner tidak boleh kosong";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const url = mode === "create" ? "/api/admin/kegiatan" : `/api/admin/kegiatan/${kegiatanId}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal menyimpan kegiatan");
        return;
      }

      const id = mode === "create" ? data.kegiatan.id : kegiatanId;
      router.push(`/admin/kegiatan/${id}`);
      router.refresh();
    } catch {
      setError("Terjadi kesalahan jaringan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="mt-6 max-w-lg space-y-4 rounded-lg border border-gray-200 bg-white p-6"
    >
      <div>
        <label className="block text-sm font-medium text-gray-700">Nama Kegiatan</label>
        <input
          required
          value={values.nama}
          onChange={(e) => update("nama", e.target.value)}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Deskripsi (opsional)</label>
        <textarea
          value={values.deskripsi}
          onChange={(e) => update("deskripsi", e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Lokasi</label>
        <input
          required
          value={values.lokasi}
          onChange={(e) => update("lokasi", e.target.value)}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Waktu Mulai</label>
          <input
            required
            type="datetime-local"
            value={values.waktuMulai}
            onChange={(e) => update("waktuMulai", e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Waktu Selesai</label>
          <input
            required
            type="datetime-local"
            value={values.waktuSelesai}
            onChange={(e) => update("waktuSelesai", e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">Kuisioner Konfirmasi Hadir (opsional)</label>
          <span className="text-xs text-gray-400">{values.pertanyaan.length}/{MAX_PERTANYAAN}</span>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Pertanyaan singkat yang wajib dijawab peserta saat konfirmasi hadir, mis. materi yang diikuti atau
          pengalaman mengikuti kegiatan.
        </p>

        <div className="mt-2 space-y-2">
          {values.pertanyaan.map((p, index) => (
            <div key={p.id ?? `new-${index}`} className="flex items-center gap-2">
              <span className="text-xs text-gray-400">{index + 1}.</span>
              <input
                value={p.teks}
                onChange={(e) => updatePertanyaan(index, e.target.value)}
                placeholder="Tulis pertanyaan"
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => removePertanyaan(index)}
                className="rounded-md border border-gray-300 px-2.5 py-2 text-xs font-medium text-gray-500 hover:bg-gray-50"
              >
                Hapus
              </button>
            </div>
          ))}
        </div>

        {values.pertanyaan.length < MAX_PERTANYAAN && (
          <button
            type="button"
            onClick={addPertanyaan}
            className="mt-2 text-sm font-medium text-gray-700 underline"
          >
            + Tambah pertanyaan
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? "Menyimpan..." : "Simpan"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Batal
        </button>
      </div>
    </form>
  );
}
