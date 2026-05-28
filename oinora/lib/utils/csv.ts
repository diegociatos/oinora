/**
 * Converte um array de objetos em CSV (RFC 4180).
 * Trata aspas, vírgulas, quebras de linha. UTF-8 com BOM pra Excel BR abrir certo.
 */
export function toCSV<T extends Record<string, unknown>>(
  rows: T[],
  headers?: { key: keyof T; label: string }[],
): string {
  if (rows.length === 0) {
    return "﻿" + (headers?.map((h) => h.label).join(",") ?? "") + "\n";
  }

  const cols = headers ?? Object.keys(rows[0]).map((k) => ({ key: k as keyof T, label: k }));

  const head = cols.map((c) => escape(c.label)).join(",");
  const body = rows
    .map((r) => cols.map((c) => escape(format(r[c.key]))).join(","))
    .join("\n");

  // BOM no início pra Excel BR detectar UTF-8 corretamente
  return "﻿" + head + "\n" + body + "\n";
}

function escape(v: string): string {
  if (v == null) return "";
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function format(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "object") {
    if (v instanceof Date) return v.toISOString();
    return JSON.stringify(v);
  }
  return String(v);
}
