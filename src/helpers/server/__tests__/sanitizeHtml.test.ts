// Regression tests for the server-side XSS sanitizer — the security boundary
// for all user-authored rich text. Exercises the real dompurify + jsdom pair,
// so a future upgrade of either package that changes sanitization behavior
// fails here instead of in production.
jest.mock("../s3", () => ({
  // Passthrough: CloudFront signature stripping is s3.ts's concern; these
  // tests only verify it is applied before sanitizing.
  stripCloudFrontSignatures: jest.fn((html: string) => html),
}));

// The app's jsdom@29 can't be imported under Jest (its ESM-only dep
// @exodus/bytes needs a transform, and next/jest pins /node_modules/ as
// ignored). The tests already run inside a jsdom environment, so hand
// DOMPurify that window instead — real dompurify on a real DOM; only the
// jsdom version differs from production.
jest.mock("jsdom", () => ({
  JSDOM: class {
    window = globalThis.window;
  },
}));

import { sanitizeRichHtml, sanitizeStoredHtml } from "../sanitizeHtml";
import { stripCloudFrontSignatures } from "../s3";

describe("sanitizeRichHtml — attack payloads", () => {
  it("strips script tags", () => {
    expect(sanitizeRichHtml('<p>hi</p><script>alert("x")</script>')).toBe(
      "<p>hi</p>"
    );
  });

  it("strips inline event handlers", () => {
    expect(sanitizeRichHtml('<img src="x.png" onerror="alert(1)">')).toBe(
      '<img src="x.png">'
    );
  });

  it("strips javascript: URLs", () => {
    const out = sanitizeRichHtml('<a href="javascript:alert(1)">x</a>');
    expect(out).not.toContain("javascript:");
  });

  it("strips iframes", () => {
    expect(
      sanitizeRichHtml('<iframe src="https://evil.example"></iframe>')
    ).toBe("");
  });

  it("returns empty string for empty input", () => {
    expect(sanitizeRichHtml("")).toBe("");
  });
});

describe("sanitizeRichHtml — editor allowlist", () => {
  it("keeps video tags with controls (editor media)", () => {
    const out = sanitizeRichHtml('<video controls src="clip.mp4"></video>');
    expect(out).toContain("<video");
    expect(out).toContain("controls");
  });

  it("keeps inline style (editor colors/alignment)", () => {
    const out = sanitizeRichHtml('<p style="text-align: center">x</p>');
    expect(out).toContain('style="text-align: center"');
  });

  it("keeps target/rel on links", () => {
    const out = sanitizeRichHtml(
      '<a href="https://example.com" target="_blank" rel="noopener">x</a>'
    );
    expect(out).toContain('target="_blank"');
    expect(out).toContain('rel="noopener"');
  });

  it("keeps basic formatting markup", () => {
    const input = "<h2>제목</h2><p><strong>굵게</strong> <em>기울임</em></p>";
    expect(sanitizeRichHtml(input)).toBe(input);
  });
});

describe("sanitizeStoredHtml", () => {
  it("strips CloudFront signatures before sanitizing", () => {
    sanitizeStoredHtml("<p>x</p>");

    expect(stripCloudFrontSignatures).toHaveBeenCalledWith("<p>x</p>");
  });

  it("still removes attack payloads", () => {
    expect(sanitizeStoredHtml("<script>alert(1)</script><p>ok</p>")).toBe(
      "<p>ok</p>"
    );
  });

  it("coerces null-ish input to empty string", () => {
    expect(sanitizeStoredHtml(undefined as unknown as string)).toBe("");
  });
});
