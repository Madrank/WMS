function escapeValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = rows.map((row) =>
    headers.map((h) => escapeValue(row[h])).join(","),
  );
  // \uFEFF = BOM UTF-8 : force Excel / Postman à lire le fichier en UTF-8 (accents corrects)
  return `\uFEFF${[headers.join(","), ...lines].join("\r\n")}`;
}
