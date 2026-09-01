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

interface SevimaResponseBody {
  attributes?: {
    nim?: string;
    nama?: string;
    program_studi?: string;
    id_program_studi?: string;
  };
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
