import { describe, it, expect } from "vitest";
import { toCsv } from "./csv";

describe("toCsv", () => {
  it("serializes simple rows with a header", () => {
    const csv = toCsv([{ a: "1", b: "2" }], ["a", "b"]);
    expect(csv).toBe("a,b\n1,2");
  });

  it("escapes values containing commas by quoting", () => {
    const csv = toCsv([{ name: "Doe, John" }], ["name"]);
    expect(csv).toBe('name\n"Doe, John"');
  });

  it("escapes values containing quotes by doubling them", () => {
    const csv = toCsv([{ note: 'She said "hi"' }], ["note"]);
    expect(csv).toBe('note\n"She said ""hi"""');
  });

  it("escapes values containing newlines by quoting", () => {
    const csv = toCsv([{ note: "line1\nline2" }], ["note"]);
    expect(csv).toBe('note\n"line1\nline2"');
  });

  it("renders null/undefined as an empty field", () => {
    const csv = toCsv([{ a: null, b: undefined }], ["a", "b"]);
    expect(csv).toBe("a,b\n,");
  });

  it("only includes the requested columns, in order", () => {
    const csv = toCsv([{ a: "1", b: "2", c: "3" }], ["c", "a"]);
    expect(csv).toBe("c,a\n3,1");
  });
});
