"use client";

import { useState } from "react";

export default function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API tidak tersedia (mis. http non-secure) — biarkan user salin manual
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
    >
      {copied ? "Tersalin!" : "Salin Link"}
    </button>
  );
}
