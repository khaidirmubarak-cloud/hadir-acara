export type KegiatanStatus = "upcoming" | "open" | "closed";

export function computeKegiatanStatus(params: {
  waktuMulai: Date;
  waktuSelesai: Date;
  ditutupManual: boolean;
}): KegiatanStatus {
  if (params.ditutupManual) return "closed";
  const now = Date.now();
  if (now < params.waktuMulai.getTime()) return "upcoming";
  if (now > params.waktuSelesai.getTime()) return "closed";
  return "open";
}
