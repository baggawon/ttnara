"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/components/lib/utils";
import { Home, MessageCircle, X } from "lucide-react";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import { useChatStore } from "@/helpers/chatStore";
import type { AlarmListResponse, AlarmReadProps } from "@/app/api/alarm/read";
import { ApiRoute, AppRoute, QueryKey } from "@/helpers/types";
import { alarmGet } from "@/helpers/get";
import { map } from "@/helpers/basic";
import AlarmItem from "@/components/2_molecules/AlarmItem";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { LenBadge } from "./LenBadge";
// import "slick-carousel/slick/slick.css";
// import "slick-carousel/slick/slick-theme.css";
import { postJson, refreshCache } from "@/helpers/common";
import type { alarmUpdateProps } from "@/app/api/alarm/update";
import useLoadingHandler from "@/helpers/customHook/useLoadingHandler";
import { useToast } from "@/components/ui/use-toast";
import { Close } from "@radix-ui/react-popover";
import { useRef } from "react";
import clsx from "clsx";
import { renderNavIcon } from "@/components/2_molecules/Input/NavIconPicker";
import type { NavParentItem } from "@/helpers/server/navMenuRead";

const ALARM_PATH = AppRoute.NotificationList;

export function MobileBottomNav({ menuItems }: { menuItems: NavParentItem[] }) {
  const pathname = usePathname();
  const isChatOpen = useChatStore((s) => s.isOpen);
  const toggleChat = useChatStore((s) => s.toggleChat);

  // Function to determine if a navigation item is active
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  // Gradient style for active text
  const activeGradientStyle = {
    background:
      "linear-gradient(135deg, #26A17B 0%, #26A17B 50%, #e9c40f 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  };

  return (
    <div className="lg:hidden fixed bottom-0 w-screen bg-white dark:bg-slate-950 border-t py-1 px-1 mt-20">
      <div className="flex justify-between items-center">
        {map(menuItems, (item) => {
          // ── Home (system) ──────────────────────────────────────
          if (item.kind === "home") {
            const homeActive = isActive("/");
            return (
              <Link
                key={item.id}
                href="/"
                className="flex-1 flex flex-col items-center"
              >
                <div className="p-2">
                  <Home
                    className={cn("h-5 w-5", homeActive && "text-primary")}
                    strokeWidth={2}
                  />
                </div>
                <span
                  className={cn("text-xs mt-1", homeActive && "font-bold")}
                  style={homeActive ? activeGradientStyle : {}}
                >
                  {item.label}
                </span>
              </Link>
            );
          }

          // ── Chat toggle (system) ───────────────────────────────
          if (item.kind === "chat_toggle") {
            return (
              <button
                key={item.id}
                type="button"
                onClick={toggleChat}
                aria-pressed={isChatOpen}
                className="flex-1 flex flex-col items-center"
              >
                <div className="p-2">
                  <MessageCircle
                    className={cn("h-5 w-5", isChatOpen && "text-primary")}
                    strokeWidth={2}
                  />
                </div>
                <span
                  className={cn("text-xs mt-1", isChatOpen && "font-bold")}
                  style={isChatOpen ? activeGradientStyle : {}}
                >
                  {item.label}
                </span>
              </button>
            );
          }

          // ── Regular link ───────────────────────────────────────
          const href = item.url || "/";
          const itemIsActive = isActive(href);
          const inner = (
            <>
              <div className="p-2">
                {renderNavIcon(
                  item.icon,
                  cn("h-5 w-5", itemIsActive && "text-primary")
                )}
              </div>
              <span
                className={cn("text-xs mt-1", itemIsActive && "font-bold")}
                style={itemIsActive ? activeGradientStyle : {}}
              >
                {item.label}
              </span>
            </>
          );

          if (href === ALARM_PATH) {
            return (
              <AlarmNavigation
                key={item.id}
                className="flex-1 p-0 h-fit gap-0 [&_svg]:size-5"
              >
                {inner}
              </AlarmNavigation>
            );
          }

          const isExternal = item.is_external;
          return (
            <Link
              key={item.id}
              href={href}
              target={isExternal ? "_blank" : undefined}
              rel={isExternal ? "noopener noreferrer" : undefined}
              className="flex-1 flex flex-col items-center"
            >
              {inner}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export const AlarmNavigation = ({
  variant = "ghost",
  size = "default",
  className,
  contentClassName,
  children,
}: {
  variant?: "default" | "outline" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  contentClassName?: string;
  children: React.ReactNode;
}) => {
  const pagination = {
    page: 1,
    pageSize: 10000,
    isRead: false,
    isPreview: true,
  };

  const { data: alarms } = useGetQuery<AlarmListResponse, AlarmReadProps>(
    {
      queryKey: [{ [QueryKey.alarms]: pagination }],
    },
    alarmGet,
    pagination
  );

  const { toast } = useToast();

  const router = useRouter();

  const { queryClient } = useLoadingHandler();

  const closeRef = useRef<HTMLButtonElement>(null);

  const tryReadAllAlarms = async () => {
    if (alarms?.alarms?.length) {
      const ids = map(alarms.alarms, (alarm) => alarm.id);
      const { isSuccess, hasMessage } = await postJson<alarmUpdateProps>(
        ApiRoute.alarmUpdate,
        {
          id: ids,
          is_read: true,
        }
      );
      if (isSuccess) {
        refreshCache(queryClient);
        return true;
      } else if (hasMessage) {
        toast({ id: hasMessage, type: "error" });
      }
      closeRef.current?.click();
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={variant}
          size={size}
          type="button"
          className={clsx("flex flex-col items-center relative", className)}
        >
          {children}
          {(alarms?.alarms?.length ?? 0) > 0 && (
            <LenBadge len={alarms?.alarms?.length} />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={clsx(
          "flex flex-col gap-4 p-0 w-screen py-4 h-[calc(100vh-68px)] relative",
          contentClassName
        )}
      >
        {(alarms?.alarms?.length ?? 0) > 0 ? (
          <div
            className="flex-1 overflow-auto px-4"
            onClick={() => closeRef.current?.click()}
          >
            {map(alarms!.alarms, (alarm) => (
              <AlarmItem key={alarm.id} alarm={alarm} />
            ))}
          </div>
        ) : (
          <div className="flex-1 w-full flex justify-center items-center">
            새 알림이 없습니다.
          </div>
        )}
        <Close ref={closeRef} className="absolute top-2 right-2">
          <X className="w-4 h-4" strokeWidth="3" />
        </Close>
        <div className="flex gap-4 items-center px-4">
          <Button
            type="button"
            onClick={() => {
              router.push(AppRoute.NotificationList);
              closeRef.current?.click();
            }}
            className="relative"
          >
            전체보기
            <LenBadge len={alarms?.pagination.totalItems} />
          </Button>
          <Button type="button" variant="outline" onClick={tryReadAllAlarms}>
            읽음처리
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
