export const APP_TIMEZONE = "Asia/Makassar"; // WITA, UTC+8, tanpa DST

/**
 * Ubah nilai <input type="datetime-local"> (mis. "2026-09-01T08:00", tanpa
 * info zona waktu) menjadi Date UTC yang benar dengan asumsi input tersebut
 * adalah jam dinding WITA — bukan jam dinding browser/server.
 */
export function parseWitaLocalInput(value: string): Date {
  return new Date(`${value}:00+08:00`);
}

/**
 * Format Date (disimpan UTC di DB) menjadi string tampilan WITA,
 * dipakai di dashboard admin & laporan export.
 */
export function formatWita(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: APP_TIMEZONE,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/**
 * Format Date menjadi value siap-pakai untuk <input type="datetime-local">
 * (jam dinding WITA), dipakai saat mengisi form edit kegiatan.
 */
export function toWitaLocalInputValue(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}
