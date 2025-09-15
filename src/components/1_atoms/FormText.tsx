import clsx from "clsx";
import type { ReactNode } from "react";

export const FormText = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <span className={clsx("text-xs text-red-600 pt-2", className)}>
      {children}
    </span>
  );
};
