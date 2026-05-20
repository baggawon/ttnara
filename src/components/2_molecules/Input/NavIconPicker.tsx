"use client";

import {
  Bell,
  BookOpen,
  Calculator,
  ChartBar,
  ChartLine,
  CircleHelp,
  DollarSign,
  Globe,
  Heart,
  Home,
  Info,
  Lightbulb,
  Mail,
  Megaphone,
  MessageCircle,
  Newspaper,
  Star,
  Tag,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/lib/utils";

export const NAV_ICON_MAP: Record<string, LucideIcon> = {
  Home,
  DollarSign,
  Lightbulb,
  Bell,
  Newspaper,
  MessageCircle,
  Trophy,
  Users,
  BookOpen,
  Megaphone,
  Tag,
  Mail,
  Info,
  Star,
  Heart,
  Globe,
  Calculator,
  ChartBar,
  ChartLine,
  CircleHelp,
};

export const NAV_ICON_NAMES = Object.keys(NAV_ICON_MAP);

export const renderNavIcon = (
  name: string | null | undefined,
  className?: string
) => {
  if (!name) return null;
  const Icon = NAV_ICON_MAP[name];
  if (!Icon) return null;
  return <Icon className={className} />;
};

export const NavIconPicker = ({
  value,
  onChange,
  disabled,
}: {
  value: string | null;
  onChange: (next: string | null) => void;
  disabled?: boolean;
}) => {
  const Selected = value ? NAV_ICON_MAP[value] : undefined;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className="w-full justify-start gap-2"
        >
          {Selected ? (
            <Selected className="h-4 w-4" />
          ) : (
            <span className="h-4 w-4 rounded-sm border border-dashed" />
          )}
          <span className="text-sm">{value ?? "아이콘 선택"}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="start">
        <div className="grid grid-cols-5 gap-1">
          <button
            type="button"
            onClick={() => onChange(null)}
            className={cn(
              "h-10 rounded-md border flex items-center justify-center text-xs",
              value === null
                ? "bg-accent text-accent-foreground"
                : "hover:bg-accent"
            )}
          >
            없음
          </button>
          {NAV_ICON_NAMES.map((name) => {
            const Icon = NAV_ICON_MAP[name];
            return (
              <button
                key={name}
                type="button"
                onClick={() => onChange(name)}
                title={name}
                className={cn(
                  "h-10 rounded-md border flex items-center justify-center",
                  value === name
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent"
                )}
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};
