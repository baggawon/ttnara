"use client";

import clsx from "clsx";
import * as React from "react";

const MenubarButton = React.forwardRef<
  React.ElementRef<"button">,
  React.ComponentPropsWithoutRef<"button">
>(({ className, children, ...props }, ref) => (
  <button
    ref={ref}
    className={clsx(
      "flex cursor-default select-none items-center rounded-sm",
      "px-3 py-1.5 text-sm font-medium outline-none",
      "focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
      className
    )}
    {...props}
  >
    {children}
  </button>
));

MenubarButton.displayName = "MenubarButton";

export { MenubarButton };
