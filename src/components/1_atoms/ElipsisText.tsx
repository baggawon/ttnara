import clsx from "clsx";
import { elipsisCondition } from "@/helpers/common";
import React from "react";
import DOMPurify from "dompurify";

export const ElipsisText = ({
  text,
  length = 30,
}: {
  text?: string | number | null;
  length?: number;
}) => (
  <div
    className={clsx(elipsisCondition(text, length))}
    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(String(text ?? "")) }}
  />
);
