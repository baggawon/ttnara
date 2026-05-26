"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { QueryKey } from "@/helpers/types";
import type { popup } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/lib/utils";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import { popupListGet } from "@/helpers/get";

function setCookie(name: string, value: string, days: number) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}

function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(";").shift() || null;
  }
  return null;
}

// Session-only suppression: a plain close (X / overlay) hides the popup for
// the current browser session without writing the multi-day cookie. This both
// keeps "close now" distinct from "don't show for N days" and prevents the
// popup from re-appearing when react-query refetches the list mid-session.
function isSessionClosed(id: number): boolean {
  try {
    return sessionStorage.getItem(`popup_${id}_session_closed`) === "true";
  } catch {
    return false;
  }
}

function markSessionClosed(id: number) {
  try {
    sessionStorage.setItem(`popup_${id}_session_closed`, "true");
  } catch {
    /* sessionStorage unavailable (private mode etc.) — best effort only */
  }
}

// Single source of truth for "should this popup be visible right now?".
// Both the initial display effect and the close handler call this, so
// advancing through multiple configured popups can't drift out of sync with
// the filter rules (device, session-closed, multi-day cookie).
function isEligible(p: popup): boolean {
  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  if (isMobile && !p.show_on_mobile) return false;
  if (!isMobile && !p.show_on_desktop) return false;
  if (isSessionClosed(p.id)) return false;
  if (p.cookie_days > 0 && getCookie(`popup_${p.id}_closed`) === "true") {
    return false;
  }
  return true;
}

interface PopupItemProps {
  popup: popup;
  onClose: () => void;
}

function PopupItem({ popup, onClose }: PopupItemProps) {
  // `persist` is true only when the user explicitly checked the
  // "don't show for N days" box. A plain close is session-only.
  const handleClose = (persist: boolean) => {
    if (persist && popup.cookie_days > 0 && popup.show_hide_option) {
      setCookie(`popup_${popup.id}_closed`, "true", popup.cookie_days);
    } else {
      markSessionClosed(popup.id);
    }
    onClose();
  };

  const getPositionClasses = () => {
    switch (popup.position) {
      case "top-left":
        return "top-4 left-4";
      case "top-right":
        return "top-4 right-4";
      case "bottom-left":
        return "bottom-4 left-4";
      case "bottom-right":
        return "bottom-4 right-4";
      case "center":
      default:
        return "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2";
    }
  };

  const isImagePopup = !!popup.image_cloud_front_url;

  // Image popups size to the image's natural aspect ratio (no fixed height),
  // so there is no letterboxing. Text popups keep a fixed-height box.
  const containerStyle: React.CSSProperties = isImagePopup
    ? {
        width: `${popup.width}px`,
        maxWidth: "calc(100vw - 32px)",
        maxHeight: "calc(100vh - 32px)",
      }
    : {
        width: `${popup.width}px`,
        maxWidth: "calc(100vw - 32px)",
        height: `${popup.height}px`,
        maxHeight: "calc(100vh - 32px)",
      };

  const body = isImagePopup ? (
    // eslint-disable-next-line @next/next/no-img-element -- intrinsic aspect
    // ratio is required to fit the popup to the image; next/image needs the
    // dimensions up front, which the popup row does not store.
    <img
      src={popup.image_cloud_front_url as string}
      alt={popup.title}
      className="block w-full h-auto"
    />
  ) : (
    <div className="p-6 flex flex-col w-full h-full">
      <h2 className="text-xl font-bold mb-4">{popup.title}</h2>
      <div
        className="flex-1 w-full overflow-y-auto whitespace-pre-wrap break-words"
        dangerouslySetInnerHTML={{
          __html: popup.content.replace(/\n\n/g, "<br/>"),
        }}
      />
    </div>
  );

  return (
    <>
      {/* 오버레이 */}
      <div
        className="fixed inset-0 bg-black/50 z-[9998]"
        onClick={() => handleClose(false)}
      />

      {/* 팝업 */}
      <div
        className={cn(
          "fixed z-[9999] bg-white dark:bg-gray-900 rounded-lg shadow-xl overflow-hidden flex flex-col",
          getPositionClasses()
        )}
        style={containerStyle}
      >
        {/* 닫기 버튼 */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 z-10 bg-white/80 dark:bg-gray-900/80 hover:bg-white dark:hover:bg-gray-900"
          onClick={() => handleClose(false)}
        >
          <X className="h-4 w-4" />
        </Button>

        {/* 컨텐츠 */}
        <div className="min-h-0 flex-1 overflow-y-auto w-full">
          {popup.link_url ? (
            <a
              href={popup.link_url}
              target={popup.link_target}
              rel={
                popup.link_target === "_blank"
                  ? "noopener noreferrer"
                  : undefined
              }
              className="block w-full"
            >
              {body}
            </a>
          ) : (
            body
          )}
        </div>

        {/* 하루 동안 보지 않기 */}
        {popup.show_hide_option && popup.cookie_days > 0 && (
          <div className="shrink-0 bg-gray-100 dark:bg-gray-800 px-4 py-2 flex items-center justify-between">
            <label className="flex items-center text-sm cursor-pointer">
              <input
                type="checkbox"
                className="mr-2"
                onChange={(e) => {
                  if (e.target.checked) {
                    handleClose(true);
                  }
                }}
              />
              {popup.cookie_days === 1
                ? "오늘 하루 보지 않기"
                : `${popup.cookie_days}일 동안 보지 않기`}
            </label>
          </div>
        )}
      </div>
    </>
  );
}

export function PopupDisplay() {
  const [activePopup, setActivePopup] = useState<popup | null>(null);

  // Popup config is static admin data: never refetch it on window focus or
  // reconnect. Without this, backgrounding the tab for >staleTime and
  // returning refetches the list (signed CloudFront URLs change every
  // response, defeating react-query's structural sharing) and the display
  // effect re-fires, re-showing dismissed popups.
  const { data: popupListData } = useGetQuery<{ popups: popup[] }, any>(
    {
      queryKey: [QueryKey.popups],
      staleTime: Infinity,
      gcTime: Infinity,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
    popupListGet,
    {}
  );

  useEffect(() => {
    setActivePopup(popupListData?.popups?.find(isEligible) ?? null);
  }, [popupListData]);

  // PopupItem writes the session-close (or persistent cookie) mark before
  // calling this, so the just-closed popup is now ineligible — `find`
  // naturally lands on the next visible popup, or null when none remain.
  const handleClosePopup = () => {
    setActivePopup(popupListData?.popups?.find(isEligible) ?? null);
  };

  if (!activePopup) return null;

  return (
    <PopupItem
      key={activePopup.id}
      popup={activePopup}
      onClose={handleClosePopup}
    />
  );
}
