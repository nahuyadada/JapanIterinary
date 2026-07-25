import { describe, it, expect } from "vitest";
import {
  CODE_ALPHABET,
  CODE_LENGTH,
  generateShareCode,
  isShareCode,
  normalizeShareCode,
  type RandomInt,
} from "@/lib/shareCode";

/** A RandomInt that walks a fixed list, so a generated code is predictable. */
function sequence(values: number[]): RandomInt {
  let i = 0;
  return () => values[i++ % values.length];
}

describe("CODE_ALPHABET", () => {
  it("omits the glyphs people confuse when reading a code aloud", () => {
    for (const ch of ["I", "L", "O", "0", "1"]) {
      expect(CODE_ALPHABET).not.toContain(ch);
    }
  });

  it("has no duplicate symbols", () => {
    expect(new Set(CODE_ALPHABET).size).toBe(CODE_ALPHABET.length);
  });
});

describe("generateShareCode", () => {
  it("returns a code of the declared length", () => {
    expect(generateShareCode()).toHaveLength(CODE_LENGTH);
  });

  it("uses only alphabet characters", () => {
    for (let i = 0; i < 50; i++) {
      expect(isShareCode(generateShareCode())).toBe(true);
    }
  });

  it("maps the injected randomness onto the alphabet, in order", () => {
    const code = generateShareCode(sequence([0, 1, 2, 3, 4, 5, 6, 7]));
    expect(code).toBe(CODE_ALPHABET.slice(0, CODE_LENGTH));
  });

  it("asks for indexes inside the alphabet's range", () => {
    const maxes: number[] = [];
    generateShareCode((max) => {
      maxes.push(max);
      return 0;
    });
    expect(maxes).toHaveLength(CODE_LENGTH);
    expect(new Set(maxes)).toEqual(new Set([CODE_ALPHABET.length]));
  });

  it("does not repeat itself across calls", () => {
    const codes = new Set(Array.from({ length: 200 }, () => generateShareCode()));
    expect(codes.size).toBe(200);
  });
});

describe("normalizeShareCode", () => {
  it("uppercases and trims", () => {
    expect(normalizeShareCode("  abcdefgh  ")).toBe("ABCDEFGH");
  });

  it("drops the spaces and dashes people add when copying by hand", () => {
    expect(normalizeShareCode("abcd-efgh")).toBe("ABCDEFGH");
    expect(normalizeShareCode("ABCD EFGH")).toBe("ABCDEFGH");
    expect(normalizeShareCode("AB-CD EF-GH")).toBe("ABCDEFGH");
  });

  it("leaves an already-clean code untouched", () => {
    expect(normalizeShareCode("ABCD2345")).toBe("ABCD2345");
  });
});

describe("isShareCode", () => {
  it("accepts a well-formed code, however it was typed", () => {
    expect(isShareCode("ABCD2345")).toBe(true);
    expect(isShareCode("abcd-2345")).toBe(true);
    expect(isShareCode(" abcd 2345 ")).toBe(true);
  });

  it("rejects codes of the wrong length", () => {
    expect(isShareCode("")).toBe(false);
    expect(isShareCode("ABCD234")).toBe(false);
    expect(isShareCode("ABCD23456")).toBe(false);
  });

  it("rejects the excluded glyphs rather than silently accepting a typo", () => {
    // Each of these is 8 characters, so only the illegal glyph can fail it.
    expect(isShareCode("ABCD234I")).toBe(false);
    expect(isShareCode("ABCD234L")).toBe(false);
    expect(isShareCode("ABCD234O")).toBe(false);
    expect(isShareCode("ABCD2340")).toBe(false);
    expect(isShareCode("ABCD2341")).toBe(false);
  });

  it("rejects punctuation that normalizing does not strip", () => {
    expect(isShareCode("ABCD_345")).toBe(false);
    expect(isShareCode("ABCD/345")).toBe(false);
    expect(isShareCode("ABCD.345")).toBe(false);
  });

  it("accepts every code it generates", () => {
    for (let i = 0; i < 100; i++) {
      const code = generateShareCode();
      expect(isShareCode(code)).toBe(true);
      expect(normalizeShareCode(code)).toBe(code);
    }
  });
});
