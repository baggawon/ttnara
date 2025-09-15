import { type ReactNode } from "react";

import { cn } from "@/components/lib/utils";

export const BackgroundWrapper = ({ children }: { children: ReactNode }) => {
  return (
    <div
      className={cn(
        "h-screen min-h-real-screen flex items-center justify-center w-full px-4 sm:px-0 bg-card"
      )}
    >
      {children}
    </div>
  );
};
