"use client"; // only in App Router

import "ckeditor5/ckeditor5.css";
import "ckeditor5-premium-features/ckeditor5-premium-features.css";
import clsx from "clsx";

const CkeditorViewer = ({
  htmlContent,
  className,
}: {
  htmlContent: string;
  className?: string;
}) => {
  return (
    <div
      dangerouslySetInnerHTML={{
        __html: htmlContent,
      }}
      className={clsx("py-8 px-4 ck-conetnt ", className)}
    />
  );
};

export default CkeditorViewer;
