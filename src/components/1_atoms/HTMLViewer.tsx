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
  // DOMPurify needs `window`, so markdown can't be sanitized during SSR.
  // We render empty on the server *and* on the first client render, then fill
  // in after mount — this keeps the SSR and hydration outputs identical.
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
      setRendered(htmlContent);
    }
  }, [htmlContent, format]);

  return (
    <div
      suppressHydrationWarning
      dangerouslySetInnerHTML={{
        __html: rendered,
      }}
      className={clsx("py-8 px-4 ck-conetnt ", className)}
    />
  );
};

export default HTMLViewer;
