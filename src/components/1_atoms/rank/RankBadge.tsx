"use client";

import Image from "next/image";
import { useState } from "react";

const isAbsoluteUrl = (s: string) =>
  s.startsWith("http://") || s.startsWith("https://") || s.startsWith("/");

export const RankBadge = ({
  badgeName,
  className,
}: {
  badgeName: string | "bronze.png";
  className?: string;
}) => {
  const [error, setError] = useState(false);
  const fallbackImage = "/badge/bronze.png";
  const resolved = isAbsoluteUrl(badgeName) ? badgeName : `/badge/${badgeName}`;
  const imageUrl = error ? fallbackImage : resolved;
  const altBase = badgeName.split("/").pop()?.split(".")[0] ?? "rank";

  return (
    <Image
      src={imageUrl}
      alt={`${altBase} rank badge`}
      width={24}
      height={24}
      className={`w-6 h-6 ${className || ""}`}
      onError={() => setError(true)}
      unoptimized={isAbsoluteUrl(badgeName)}
    />
  );
};
