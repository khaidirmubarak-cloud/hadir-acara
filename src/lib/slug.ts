import { customAlphabet } from "nanoid";

// Alfabet tanpa karakter ambigu (0/O, 1/l/I) — slug ini tampil di QR/link publik.
const generateId = customAlphabet("23456789abcdefghjkmnpqrstuvwxyz", 10);

export function generateKegiatanSlug(): string {
  return generateId();
}
