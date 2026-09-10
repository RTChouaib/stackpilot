/**
 * Sanitizes free-text user input before it is stored or interpolated into an
 * AI prompt.
 *
 * Note on defense layering: Drizzle ORM already parameterizes every query,
 * so this is not the primary SQL-injection defense — that's the ORM's job,
 * and it's already handled correctly as long as raw `sql` template
 * interpolation is avoided. Stripping quote/semicolon characters here is a
 * secondary hardening layer plus, more importantly, it removes characters
 * that could be used to break out of the delimited block we wrap user text
 * in before sending it to the LLM (see lib/ai/generate.ts).
 */

const HTML_TAG_PATTERN = /<[^>]*>/g;

// Characters with special meaning in SQL string literals or statement
// termination. Stripped as defense-in-depth even though parameterized
// queries already prevent injection through this path.
const SQL_CONTROL_CHARS = /['";]/g;

// Common prompt-injection phrasing aimed at overriding the system prompt.
// Matched case-insensitively; whitespace between words is normalized so
// "ignore   previous\ninstructions" is still caught.
const PROMPT_INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?previous\s+instructions/gi,
  /ignore\s+the\s+above/gi,
  /disregard\s+(all\s+)?(prior|previous)\s+instructions/gi,
  /system\s+prompt/gi,
  /override\s+system/gi,
  /you\s+are\s+now\s+/gi,
  /new\s+instructions\s*:/gi,
  /act\s+as\s+(if\s+you\s+are\s+)?/gi,
];

const REDACTED = "[redacted]";

export function sanitizeInputText(input: string): string {
  if (typeof input !== "string") return "";

  let clean = input;

  // 1. Strip HTML/XML tags to prevent stored XSS if this text is ever
  //    rendered without further escaping, and to remove a common
  //    prompt-injection vector (hidden instructions inside tags).
  clean = clean.replace(HTML_TAG_PATTERN, "");

  // 2. Strip SQL control characters (defense-in-depth — see note above).
  clean = clean.replace(SQL_CONTROL_CHARS, "");

  // 3. Neutralize known prompt-injection phrasing rather than deleting the
  //    surrounding text, so the sanitized string still reads naturally for
  //    storage/display purposes.
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    clean = clean.replace(pattern, REDACTED);
  }

  // 4. Collapse excess whitespace left behind by the replacements above and
  //    hard-cap length so a single field can't be used to blow up prompt
  //    size or storage.
  clean = clean.replace(/\s{2,}/g, " ").trim();
  const MAX_LENGTH = 2000;
  if (clean.length > MAX_LENGTH) clean = clean.slice(0, MAX_LENGTH);

  return clean;
}

/**
 * Recursively sanitizes every string value in a plain object/array, leaving
 * other types untouched. Used to sanitize the full questionnaire payload in
 * one call before it's persisted or used in prompt construction.
 */
export function sanitizeDeep<T>(value: T): T {
  if (typeof value === "string") {
    return sanitizeInputText(value) as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map((v) => sanitizeDeep(v)) as unknown as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = sanitizeDeep(v);
    }
    return out as T;
  }
  return value;
}
