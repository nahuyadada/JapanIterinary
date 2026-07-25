import { randomInt } from "crypto";

/**
 * Alphabet for share codes: uppercase letters and digits with the ambiguous glyphs
 * removed (no I, L, O, 0, 1). Someone reading a code off a phone screen or hearing it
 * out loud shouldn't be able to mistype it.
 */
export const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/**
 * A code is the only credential protecting a shared trip, so it has to be long enough
 * that trips can't be enumerated. 8 characters of a 31-symbol alphabet is ~8.5e11
 * combinations — short enough to read aloud, far too many to scan.
 */
export const CODE_LENGTH = 8;

/** Injectable for tests: returns an integer in [0, max). */
export type RandomInt = (max: number) => number;

/** Generate a share code. Uses crypto randomness unless a source is injected. */
export function generateShareCode(random: RandomInt = (max) => randomInt(max)): string {
  let out = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += CODE_ALPHABET[random(CODE_ALPHABET.length)];
  }
  return out;
}

/**
 * Clean up a code as a human might type or paste it: trim, uppercase, and drop the
 * spaces and dashes people insert when copying by hand.
 */
export function normalizeShareCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[\s-]/g, "");
}

/** Whether a normalized code has the right length and only legal characters. */
export function isShareCode(raw: string): boolean {
  const code = normalizeShareCode(raw);
  if (code.length !== CODE_LENGTH) return false;
  return [...code].every((ch) => CODE_ALPHABET.includes(ch));
}
