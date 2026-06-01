"use client"; // only in App Router

import clsx from "clsx";
import DOMPurify from "dompurify";
import { marked } from "marked";
import { useEffect, useState } from "react";

export type ContentFormat = "html" | "markdown";

const HTMLViewer = ({
  htmlContent,
  format = "html",
  className,
}: {
  htmlContent: string;
  format?: ContentFormat;
  className?: string;
}) => {
  // DOMPurify needs `window`, so content can't be sanitized during SSR.
  // We render the raw HTML on the server *and* on the first client render,
  // then sanitize after mount — this keeps the SSR and hydration outputs
  // identical. Markdown can't render on the server at all (it needs marked +
  // DOMPurify), so it starts empty and fills in after mount.
  const [rendered, setRendered] = useState(
    format === "markdown" ? "" : htmlContent
  );

  useEffect(() => {
    if (format === "markdown") {
      setRendered(
        DOMPurify.sanitize(
          marked.parse(htmlContent ?? "", { async: false }) as string
        )
      );
    } else {
      // Sanitize but keep inline styles (text color / alignment set in the
      // editor) and media tags so the output matches what was authored.
      setRendered(
        DOMPurify.sanitize(htmlContent ?? "", {
          ADD_TAGS: ["video"],
          ADD_ATTR: ["controls", "style"],
        })
      );
    }
  }, [htmlContent, format]);

  return (
    <div
      suppressHydrationWarning
      dangerouslySetInnerHTML={{
        __html: rendered,
      }}
      className={clsx("rich-content py-8 px-4", className)}
    />
  );
};

export default HTMLViewer;
