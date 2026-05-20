"use client";

import clsx from "clsx";
import Link from "next/link";
import { ImageIcon } from "lucide-react";
import { useBrand } from "@/components/1_atoms/BrandProvider";
import { cn } from "@/components/lib/utils";

const SIZE_CLASS = {
  small: { h: "h-10", placeholderW: "w-20" },
  large: { h: "h-12", placeholderW: "w-24" },
} as const;

export default function Logo({
  href = "/",
  className = "",
  imgClassName = "",
  size = "small",
}: {
  href?: string;
  className?: string;
  imgClassName?: string;
  size?: "small" | "large";
}) {
  const brand = useBrand();
  const logoUrl = brand?.logoImageUrl ?? null;
  const altText = brand?.siteName || "logo";
  const sizeClass = SIZE_CLASS[size];

  return (
    <Link href={href} className={clsx("flex items-center", className)}>
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt={altText}
          className={cn("w-auto object-contain", sizeClass.h, imgClassName)}
        />
      ) : (
        <div
          className={cn(
            "flex items-center justify-center rounded-md border border-dashed border-black/20 bg-black/5 text-black/30",
            sizeClass.h,
            sizeClass.placeholderW,
            imgClassName
          )}
          aria-label="logo placeholder"
        >
          <ImageIcon className="w-4 h-4" />
        </div>
      )}
    </Link>
  );
}
