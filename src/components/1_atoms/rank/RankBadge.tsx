"use client";

import Image from "next/image";
import { useState } from "react";

export const RankBadge = ({
  badgeName,
  className,
}: {
  badgeName: string | "bronze.png";
  className?: string;
}) => {
  const [error, setError] = useState(false);
  const name = badgeName.split(".")[0];
  const fallbackImage = "/badge/bronze.png";
  const imageUrl = error ? fallbackImage : `/badge/${badgeName}`;

  return (
    <Image
      src={imageUrl}
      alt={`${name} rank badge`}
      width={24}
      height={24}
      className={`w-6 h-6 ${className || ""}`}
      onError={() => setError(true)}
    />
  );
};
