import PDFDocument from "pdfkit";
import { formatWita } from "@/lib/timezone";
import type { ExportKegiatanInfo, ExportKehadiranRow } from "./kehadiran-excel";

const COLS = [
  { label: "No", width: 30 },
  { label: "Tipe", width: 75 },
  { label: "NIM/NIP", width: 95 },
  { label: "Nama", width: 140 },
  { label: "Program Studi", width: 140 },
  { label: "Waktu Konfirmasi", width: 105 },
];

export async function buildKehadiranPdf(kegiatan: ExportKegiatanInfo, rows: ExportKehadiranRow[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;
    const bottom = doc.page.height - doc.page.margins.bottom;

    doc.font("Helvetica-Bold").fontSize(13).text("UNIVERSITAS ISLAM NEGERI PALOPO", left, doc.y, {
      width: right - left,
      align: "center",
    });
    doc.font("Helvetica").fontSize(10).text("Laporan Daftar Hadir Kegiatan", left, doc.y, {
      width: right - left,
      align: "center",
    });
    doc.moveTo(left, doc.y + 6).lineTo(right, doc.y + 6).lineWidth(1).stroke();
    doc.moveDown(1.5);

    doc.font("Helvetica-Bold").fontSize(10).text("Kegiatan: ", left, doc.y, { continued: true });
    doc.font("Helvetica").text(kegiatan.nama);
    doc.font("Helvetica-Bold").text("Lokasi: ", left, doc.y, { continued: true });
    doc.font("Helvetica").text(kegiatan.lokasi);
    doc.font("Helvetica-Bold").text("Waktu: ", left, doc.y, { continued: true });
    doc.font("Helvetica").text(`${formatWita(kegiatan.waktuMulai)} — ${formatWita(kegiatan.waktuSelesai)}`);
    doc.font("Helvetica-Bold").text("Jumlah Peserta: ", left, doc.y, { continued: true });
    doc.font("Helvetica").text(String(rows.length));
    doc.moveDown(1);

    function colX(index: number): number {
      let x = left;
      for (let i = 0; i < index; i++) x += COLS[i].width;
      return x;
    }
    const rowH = 20;

    function drawHeaderRow() {
      const top = doc.y;
      doc.font("Helvetica-Bold").fontSize(9);
      COLS.forEach((col, i) => {
        const x = colX(i);
        doc.rect(x, top, col.width, rowH).fillAndStroke("#E8E8E8", "#999999");
        doc.fillColor("#000000").text(col.label, x + 4, top + 6, { width: col.width - 8 });
      });
      doc.y = top + rowH;
      doc.font("Helvetica").fontSize(9);
    }

    function ensureSpace() {
      if (doc.y + rowH > bottom) {
        doc.addPage();
        doc.y = doc.page.margins.top;
        drawHeaderRow();
      }
    }

    drawHeaderRow();
    rows.forEach((row, index) => {
      ensureSpace();
      const top = doc.y;
      const values = [
        String(index + 1),
        row.tipePeserta === "PEGAWAI" ? "Dosen/Tendik" : "Mahasiswa",
        row.nim,
        row.nama,
        row.programStudi ?? "—",
        formatWita(row.waktuKonfirmasi),
      ];
      values.forEach((val, i) => {
        const x = colX(i);
        doc.rect(x, top, COLS[i].width, rowH).stroke("#cccccc");
        doc.text(val, x + 4, top + 6, { width: COLS[i].width - 8, ellipsis: true, lineBreak: false });
      });
      doc.y = top + rowH;
    });

    doc.end();
  });
}
