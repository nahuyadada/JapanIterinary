import { describe, expect, it } from "vitest";
import { thumbUrl } from "@/lib/image";
import { PLACES } from "@/data/places";

describe("thumbUrl", () => {
  it("turns an original into a sized thumbnail", () => {
    expect(thumbUrl("https://upload.wikimedia.org/wikipedia/commons/4/43/Sensoji_2023.jpg", 250)).toBe(
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Sensoji_2023.jpg/250px-Sensoji_2023.jpg"
    );
  });

  it("resizes an existing thumbnail URL", () => {
    expect(
      thumbUrl(
        "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Meiji_Jingu_2023-3.jpg/3840px-Meiji_Jingu_2023-3.jpg",
        500
      )
    ).toBe("https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Meiji_Jingu_2023-3.jpg/500px-Meiji_Jingu_2023-3.jpg");
  });

  it("handles non-commons projects and encoded names", () => {
    expect(thumbUrl("https://upload.wikimedia.org/wikipedia/en/8/8e/Tower_%28a%29.jpg", 250)).toBe(
      "https://upload.wikimedia.org/wikipedia/en/thumb/8/8e/Tower_%28a%29.jpg/250px-Tower_%28a%29.jpg"
    );
  });

  it("leaves other hosts and formats alone", () => {
    expect(thumbUrl("https://images.unsplash.com/photo-1", 250)).toBe("https://images.unsplash.com/photo-1");
    const svg = "https://upload.wikimedia.org/wikipedia/commons/a/ab/Logo.svg";
    expect(thumbUrl(svg, 250)).toBe(svg);
  });

  it("produces a thumbnail for every catalog photo", () => {
    for (const p of PLACES) {
      if (!p.imageUrl) continue;
      expect(thumbUrl(p.imageUrl, 250), p.id).toContain("/250px-");
    }
  });
});
