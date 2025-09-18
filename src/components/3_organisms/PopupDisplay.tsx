"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import Image from "next/image";
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

interface PopupItemProps {
  popup: popup;
  onClose: () => void;
}

function PopupItem({ popup, onClose }: PopupItemProps) {
  const handleClose = () => {
    if (popup.cookie_days > 0 && popup.show_hide_option) {
      setCookie(`popup_${popup.id}_closed`, "true", popup.cookie_days);
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

  return (
    <>
      {/* 오버레이 */}
      <div
        className="fixed inset-0 bg-black/50 z-[9998]"
        onClick={handleClose}
      />

      {/* 팝업 */}
      <div
        className={cn(
          "fixed z-[9999] bg-white dark:bg-gray-900 rounded-lg shadow-xl overflow-hidden",
          getPositionClasses()
        )}
        style={{
          width: `${popup.width}px`,
          maxWidth: "calc(100vw - 32px)",
          height: `${popup.height}px`,
          maxHeight: "calc(100vh - 32px)",
        }}
      >
        {/* 닫기 버튼 */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 z-10 bg-white/80 dark:bg-gray-900/80 hover:bg-white dark:hover:bg-gray-900"
          onClick={handleClose}
        >
          <X className="h-4 w-4" />
        </Button>

        {/* 컨텐츠 */}
        <div className="h-full overflow-y-auto w-full">
          {popup.link_url ? (
            <a
              href={popup.link_url}
              target={popup.link_target}
              rel={
                popup.link_target === "_blank"
                  ? "noopener noreferrer"
                  : undefined
              }
              className="block h-full w-full"
            >
              {renderBody(popup)}
            </a>
          ) : (
            renderBody(popup)
          )}
        </div>

        {/* 하루 동안 보지 않기 */}
        {popup.show_hide_option && popup.cookie_days > 0 && (
          <div className="absolute bottom-0 left-0 right-0 bg-gray-100 dark:bg-gray-800 px-4 py-2 flex items-center justify-between">
            <label className="flex items-center text-sm cursor-pointer">
              <input
                type="checkbox"
                className="mr-2"
                onChange={(e) => {
                  if (e.target.checked) {
                    handleClose();
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
  const [activePopups, setActivePopups] = useState<popup[]>([]);
  const [currentPopupIndex, setCurrentPopupIndex] = useState(0);

  const { data: popupListData } = useGetQuery<{ popups: popup[] }, any>(
    {
      queryKey: [QueryKey.popups],
    },
    popupListGet,
    {}
  );

  useEffect(() => {
    if (popupListData?.popups) {
      // 쿠키 확인하여 이미 닫은 팝업 필터링
      const filteredPopups = popupListData.popups.filter((popup: popup) => {
        // 디바이스 타입 확인
        const isMobile =
          /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
            navigator.userAgent
          );

        if (isMobile && !popup.show_on_mobile) return false;
        if (!isMobile && !popup.show_on_desktop) return false;

        // 쿠키 확인
        if (popup.cookie_days > 0) {
          const closedCookie = getCookie(`popup_${popup.id}_closed`);
          if (closedCookie === "true") return false;
        }

        return true;
      });

      if (filteredPopups.length > 0) {
        setActivePopups([filteredPopups[0]]);
        setCurrentPopupIndex(0);
      }
    }
  }, [popupListData]);

  const handleClosePopup = () => {
    // 현재 팝업 닫고 다음 팝업 표시
    const allPopups = popupListData?.popups || [];
    if (currentPopupIndex < allPopups.length - 1) {
      setCurrentPopupIndex(currentPopupIndex + 1);
      setActivePopups([allPopups[currentPopupIndex + 1]]);
    } else {
      setActivePopups([]);
    }
  };

  if (activePopups.length === 0) return null;

  return (
    <>
      {activePopups.map((popup) => (
        <PopupItem key={popup.id} popup={popup} onClose={handleClosePopup} />
      ))}
    </>
  );
}

const renderBody = (popup: popup) => (
  <>
    {popup.image_cloud_front_url ? (
      <div className="relative h-full">
        <Image
          src={popup.image_cloud_front_url}
          alt={popup.title}
          fill
          className="object-contain"
        />
      </div>
    ) : (
      <div className="p-6 h-full flex flex-col w-full">
        <h2 className="text-xl font-bold mb-4">{popup.title}</h2>
        <div
          className="flex-1 w-full overflow-y-auto whitespace-pre-wrap break-words"
          dangerouslySetInnerHTML={{
            __html: popup.content.replace(/\n\n/g, "<br/>"),
          }}
        />
      </div>
    )}
  </>
);
