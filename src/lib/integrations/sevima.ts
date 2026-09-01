import axios, { AxiosError } from "axios";
import { env } from "@/lib/env";

export type SevimaErrorCode = "CONFIG_ERROR" | "NOT_FOUND" | "UNAVAILABLE";

export class SevimaError extends Error {
  code: SevimaErrorCode;
  publicMessage: string;

  constructor(code: SevimaErrorCode, publicMessage: string, cause?: unknown) {
    super(publicMessage);
    this.name = "SevimaError";
    this.code = code;
    this.publicMessage = publicMessage;
    this.cause = cause;
  }
}

export interface DataMahasiswa {
  nim: string;
  nama: string;
  programStudi: string;
  programStudiSevimaId: string;
}

export interface DataPegawai {
  nip: string;
  nama: string;
}

interface SevimaResponseBody {
  attributes?: {
    nim?: string;
    nama?: string;
    program_studi?: string;
    id_program_studi?: string;
  };
}

// Karakter zero-width yang kadang nyelip di field "nama" Sevima (mis. U+200C sebelum
// nama), tidak dibuang oleh trim() biasa karena bukan whitespace — daftar eksplisit
// per-codepoint supaya tidak ada karakter tak-terlihat di source code ini sendiri.
const ZERO_WIDTH_CHARS_RE = /[​‌‍‎‏﻿]/g;

interface SevimaPegawaiListResponse {
  data?: Array<{ attributes?: { nip?: string; nama?: string } }>;
  urls?: { next?: string | null };
}

const client = axios.create({
  baseURL: env.SEVIMA_BASE_URL,
  timeout: env.SEVIMA_TIMEOUT_MS,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-App-Key": env.SEVIMA_APP_KEY,
    "X-Secret-Key": env.SEVIMA_SECRET_KEY,
  },
});

function mapError(err: unknown): SevimaError {
  if (axios.isAxiosError(err)) {
    const axiosErr = err as AxiosError;
    const status = axiosErr.response?.status;

    if (status === 401 || status === 403) {
      console.error(
        `[Sevima] Konfigurasi App Key/Secret Key bermasalah (status ${status}).`,
        axiosErr.response?.data,
      );
      return new SevimaError(
        "CONFIG_ERROR",
        "Sistem sedang bermasalah, silakan coba beberapa saat lagi",
        axiosErr,
      );
    }

    if (status === 404) {
      return new SevimaError("NOT_FOUND", "NIM tidak ditemukan. Pastikan NIM Anda benar.", axiosErr);
    }

    console.error("[Sevima] API tidak dapat dihubungi/timeout.", axiosErr.message);
    return new SevimaError(
      "UNAVAILABLE",
      "Gagal mengambil data, silakan coba lagi dalam beberapa saat.",
      axiosErr,
    );
  }

  console.error("[Sevima] Error tidak terduga.", err);
  return new SevimaError(
    "UNAVAILABLE",
    "Gagal mengambil data, silakan coba lagi dalam beberapa saat.",
    err,
  );
}

function isRetryable(err: unknown): boolean {
  if (!axios.isAxiosError(err)) return false;
  const status = err.response?.status;
  if (status === undefined) return true; // timeout / network error
  return status >= 500;
}

/**
 * Ambil data mahasiswa dari API Sevima Platform (SIAKAD Cloud).
 * Melakukan 1x retry untuk timeout/error jaringan/5xx sebelum menyerah.
 */
export async function fetchMahasiswa(nim: string): Promise<DataMahasiswa> {
  let lastErr: unknown;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await client.get<SevimaResponseBody>(`/siakadcloud/v1/mahasiswa/${nim}`);
      const attrs = res.data?.attributes;

      if (!attrs || !attrs.nim) {
        throw new SevimaError("NOT_FOUND", "NIM tidak ditemukan. Pastikan NIM Anda benar.");
      }

      return {
        nim: attrs.nim,
        nama: attrs.nama ?? "",
        programStudi: attrs.program_studi ?? "",
        programStudiSevimaId: attrs.id_program_studi ?? "",
      };
    } catch (err) {
      if (err instanceof SevimaError) throw err;
      lastErr = err;
      if (attempt === 0 && isRetryable(err)) continue;
      throw mapError(err);
    }
  }

  throw mapError(lastErr);
}

// Sevima tidak menyediakan endpoint "cari 1 pegawai by NIP" seperti mahasiswa — hanya
// endpoint daftar (dipaginasi lewat "urls.next", bukan "links.next" seperti JSON:API
// standar). Jadi seluruh daftar pegawai+dosen di-cache in-memory dan dicari di sana,
// supaya dari sisi peserta tetap terasa seperti "ketik NIP, langsung ketemu" persis
// alur mahasiswa — bukan berarti Sevima benar-benar punya lookup per-NIP.
const PEGAWAI_CACHE_TTL_MS = 60 * 60 * 1000; // 1 jam
let pegawaiCache: { byNip: Map<string, DataPegawai>; fetchedAt: number } | null = null;

async function fetchSevimaEmployeeResource(resourcePath: string): Promise<DataPegawai[]> {
  const employees: DataPegawai[] = [];
  let url: string | null = resourcePath;

  while (url) {
    // client sudah punya baseURL env.SEVIMA_BASE_URL — axios otomatis mengabaikannya
    // kalau `url` di sini absolut (nilai "urls.next" dari halaman sebelumnya).
    const res: { data: SevimaPegawaiListResponse } = await client.get<SevimaPegawaiListResponse>(url);
    for (const record of res.data?.data ?? []) {
      const nip = record.attributes?.nip?.trim();
      const nama = record.attributes?.nama?.replace(ZERO_WIDTH_CHARS_RE, "").trim();
      if (nip && nama) employees.push({ nip, nama });
    }
    url = res.data?.urls?.next ?? null;
  }

  return employees;
}

async function loadPegawaiCache(): Promise<Map<string, DataPegawai>> {
  try {
    const [pegawai, dosen] = await Promise.all([
      fetchSevimaEmployeeResource("/siakadcloud/v1/pegawai"),
      fetchSevimaEmployeeResource("/siakadcloud/v1/dosen"),
    ]);

    // Dedupe by NIP — data /dosen menang kalau bentrok dengan /pegawai (pola sama
    // seperti dashboard-kinerja, dosen non-PNS memakai NIDN pada field "nip").
    const byNip = new Map<string, DataPegawai>();
    for (const emp of [...pegawai, ...dosen]) byNip.set(emp.nip, emp);

    pegawaiCache = { byNip, fetchedAt: Date.now() };
    return byNip;
  } catch (err) {
    if (pegawaiCache) return pegawaiCache.byNip; // fallback ke cache basi drpd error total
    throw mapError(err);
  }
}

async function ensurePegawaiCache(): Promise<Map<string, DataPegawai>> {
  if (pegawaiCache && Date.now() - pegawaiCache.fetchedAt < PEGAWAI_CACHE_TTL_MS) {
    return pegawaiCache.byNip;
  }
  return loadPegawaiCache();
}

/**
 * Cari dosen/tenaga kependidikan berdasarkan NIP dari daftar pegawai+dosen Sevima
 * (di-cache in-memory 1 jam). Sevima hanya menyediakan nip+nama untuk pegawai —
 * tidak ada unit kerja/jabatan seperti program studi pada data mahasiswa.
 */
export async function fetchPegawai(nip: string): Promise<DataPegawai> {
  const byNip = await ensurePegawaiCache();
  const pegawai = byNip.get(nip);
  if (!pegawai) {
    throw new SevimaError("NOT_FOUND", "NIP tidak ditemukan. Pastikan NIP Anda benar.");
  }
  return pegawai;
}
