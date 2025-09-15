"use client";

import * as React from "react";
import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import useEffectFunctionHook from "@/helpers/customHook/useEffectFunction";

export function ModeToggle({ className }: { className?: string }) {
  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  useEffectFunctionHook({
    Function: () => {
      setMounted(true);
    },
    dependency: [],
  });

  const handleClick = () => {
    switch (theme) {
      case "light":
        setTheme("dark");
        break;
      case "dark":
        setTheme("system");
        break;
      default:
        setTheme("light");
        break;
    }
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={handleClick}
      className={className}
    >
      {mounted && theme === "light" && (
        <Sun className="h-[1.2rem] w-[1.2rem]" />
      )}
      {mounted && theme === "dark" && (
        <Moon className="h-[1.2rem] w-[1.2rem]" />
      )}
      {mounted && theme === "system" && (
        <Monitor className="h-[1.2rem] w-[1.2rem]" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
