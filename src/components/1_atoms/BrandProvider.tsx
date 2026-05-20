"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { BrandSettings } from "@/helpers/server/brandSettings";

const BrandContext = createContext<BrandSettings | null>(null);

export const BrandProvider = ({
  brand,
  children,
}: {
  brand: BrandSettings;
  children: ReactNode;
}) => {
  return (
    <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>
  );
};

export const useBrand = (): BrandSettings | null => {
  return useContext(BrandContext);
};
