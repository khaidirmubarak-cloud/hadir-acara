import QRCode from "qrcode";

export function generateQrPngBuffer(url: string): Promise<Buffer> {
  return QRCode.toBuffer(url, { type: "png", width: 512, margin: 2 });
}

export function generateQrSvgString(url: string): Promise<string> {
  return QRCode.toString(url, { type: "svg", width: 320, margin: 2 });
}
