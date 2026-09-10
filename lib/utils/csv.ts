/**
 * Minimal, dependency-free CSV serializer. Escapes values containing commas,
 * quotes, or newlines per RFC 4180 by wrapping in quotes and doubling any
 * internal quotes.
 */
export function toCsv(rows: Record<string, unknown>[], columns: string[]): string {
  const escape = (value: unknown): string => {
    const str = value === null || value === undefined ? "" : String(value);
    if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
    return str;
  };
  const header = columns.map(escape).join(",");
  const body = rows.map((row) => columns.map((col) => escape(row[col])).join(","));
  return [header, ...body].join("\n");
}
