"use client";

import type { ReactNode } from "react";
import { useIsMobile } from "@/helpers/customHook/useWindowSize";

export const ShowPageByWidth = ({
  width,
  mobile,
  pc,
}: {
  width: number;
  mobile: ReactNode;
  pc: ReactNode;
}) => {
  const isMobile = useIsMobile(width);
  return <>{isMobile ? <>{mobile}</> : <>{pc}</>}</>;
};
