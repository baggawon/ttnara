"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cloneElement, isValidElement } from "react";

import { cn } from "@/components/lib/utils";

interface SidebarNavItemProps {
  href: string;
  title: string;
  icon: React.ReactNode;
}

interface SidebarNavCustomProps {
  items: SidebarNavItemProps[];
}

type SidebarNavProps = SidebarNavCustomProps &
  React.HTMLAttributes<HTMLElement>;

export function SidebarNav({ className, items, ...props }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap sm:gap-2",
        className
      )}
      {...props}
    >
      {items.map((item) => {
        const isActive = pathname === item.href;
        const iconEl = isValidElement(item.icon)
          ? cloneElement(
              item.icon as React.ReactElement<{ className?: string }>,
              {
                className: cn(
                  "w-4 h-4 shrink-0",
                  (item.icon as React.ReactElement<{ className?: string }>)
                    .props?.className
                ),
              }
            )
          : item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            title={item.title}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "group inline-flex h-9 items-center justify-center gap-1.5 rounded-md border px-3 text-sm font-medium whitespace-nowrap transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "sm:justify-start sm:h-10",
              isActive
                ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                : "bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            {iconEl}
            <span className="truncate">{item.title}</span>
          </Link>
        );
      })}
    </nav>
  );
}
