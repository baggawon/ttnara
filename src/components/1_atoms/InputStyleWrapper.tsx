"use client";

import clsx from "clsx";
import type { HTMLAttributes, ReactNode } from "react";

export interface InputProps extends HTMLAttributes<HTMLDivElement> {}

export const InputStyleWrapper = ({
  className,
  children,
  ...props
}: {
  className?: string;
  children: ReactNode;
} & InputProps) => {
  return (
    <div
      className={clsx(
        "flex-wrap flex w-full rounded-md border border-gray-200 border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
