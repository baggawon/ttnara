"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";

import { cn } from "@/components/lib/utils";
import { buttonVariants } from "@/components/ui/button";

interface SidebarNavItemProps {
  href: string;
  title: string;
  icon: React.ReactNode;
}

interface SidebarNavCustomProps {
  items: SidebarNavItemProps[];
  onCollapseToggle?: (collapsed: boolean) => void;
}

type SidebarNavProps = SidebarNavCustomProps &
  React.HTMLAttributes<HTMLElement>;

export function SidebarNav({
  className,
  items,
  onCollapseToggle,
  ...props
}: SidebarNavProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if we're on a mobile device on mount and when resizing
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint is typically 1024px
    };

    // Initial check
    checkIfMobile();

    // Add resize listener
    window.addEventListener("resize", checkIfMobile);

    // Cleanup
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  const toggleSidebar = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    if (onCollapseToggle) {
      onCollapseToggle(newCollapsedState);
    }
  };

  return (
    <div className={cn("flex flex-col", isCollapsed ? "lg:w-12" : "w-full")}>
      {/* {!isMobile && (
        <button
          onClick={toggleSidebar}
          className="hidden lg:block self-end p-2 mb-2 text-gray-500 hover:text-gray-700"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      )} */}
      <nav
        className={cn(
          "flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1 transition-all duration-300 flex-wrap",
          className
        )}
        {...props}
      >
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              buttonVariants({ variant: "ghost" }),
              pathname === item.href
                ? "bg-muted hover:bg-muted"
                : "hover:bg-transparent hover:underline",
              isCollapsed ? "justify-center" : "justify-start",
              "overflow-hidden whitespace-nowrap",
              !isMobile && isCollapsed ? "lg:w-10 " : ""
            )}
            title={item.title}
          >
            {!isMobile && isCollapsed ? item.icon : item.title}
          </Link>
        ))}
      </nav>
    </div>
  );
}
