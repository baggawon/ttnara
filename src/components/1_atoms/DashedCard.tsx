"use client";

import clsx from "clsx";
import React from "react";

const DashedCard = ({
  children,
  className,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
} & Partial<React.HTMLAttributes<HTMLDivElement>>) => (
  <div
    className={clsx(
      "grow border border-dashed border-neutral-300 rounded-md p-3 m-y-1 relative xl:basis-1/2",
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export default DashedCard;
