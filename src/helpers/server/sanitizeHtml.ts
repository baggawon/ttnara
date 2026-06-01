import "server-only";

import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";

import { stripCloudFrontSignatures } from "./s3";

// Server-side DOMPurify needs a DOM to operate on. jsdom provides one; the
// instance is created once at module load and reused for every sanitize call.
// jsdom's window isn't structurally identical to the lib.dom `Window` type
// DOMPurify expects, but it satisfies the WindowLike surface it actually uses.
const purify = createDOMPurify(
  new JSDOM("").window as unknown as Window & typeof globalThis
);

// Tags/attributes the rich-text editor (SimpleMarkdownEditor) can emit on top
// of DOMPurify's defaults. Keep this in sync with the client viewer
// (HTMLViewer) so server- and client-sanitized output match:
//   - <video controls> for uploaded clips
//   - inline `style` for text color / alignment authored in the editor
//   - target/rel so externally-opened links survive
const ADD_TAGS = ["video"];
const ADD_ATTR = ["controls", "style", "target", "rel"];

/**
 * Sanitize authored rich-text HTML against the editor's allowlist.
 * Strips scripts/event handlers/unknown tags while preserving the formatting,
 * media, colors and alignment the editor produces.
 */
export const sanitizeRichHtml = (html: string): string => {
  if (!html) return "";
  return purify.sanitize(html, { ADD_TAGS, ADD_ATTR });
};

/**
 * Prepare editor HTML for DB storage: strip CloudFront signing params first
 * (so signatures aren't persisted), then sanitize. Use this at every write
 * path that persists rich-text content.
 */
export const sanitizeStoredHtml = (html: string): string =>
  sanitizeRichHtml(stripCloudFrontSignatures(html ?? ""));
