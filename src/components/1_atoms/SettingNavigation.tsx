"use client";

import clsx from "clsx";
import { Menubar, MenubarMenu, MenubarTrigger } from "@/components/ui/menubar";
import { map } from "@/helpers/basic";
import useEffectFunctionHook from "@/helpers/customHook/useEffectFunction";
import { AppRoute } from "@/helpers/types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useRef, useState, type ReactNode } from "react";

export const maxExpandedStep = 1;

export const SettingNavigation = (props: { children: ReactNode }) => {
  const pathname = usePathname();

  const router = useRouter();

  const [expandedStep, setExpandedStep] = useState(maxExpandedStep);

  const prevExpandedStep = useRef(expandedStep);
  const sizeRef = useRef<HTMLButtonElement>(null);

  useEffectFunctionHook({
    Function: () => {
      if (sizeRef.current && document.getElementById("content")) {
        if (prevExpandedStep.current < expandedStep) {
          setTimeout(
            () =>
              (document.getElementById("content")!.style.width = `calc(100% - ${
                sizeRef.current!.getBoundingClientRect().width
              }px)`),
            200
          );
        } else {
          document.getElementById("content")!.style.width = `calc(100% - ${
            sizeRef.current!.getBoundingClientRect().width
          }px)`;
        }
      }
      prevExpandedStep.current = expandedStep;
    },
    dependency: [expandedStep, sizeRef.current],
  });

  const getCurrentPathClassName = (path: AppRoute) =>
    clsx(
      pathname === path &&
        "bg-primary text-white hover:!bg-primary hover:!text-white"
    );

  return (
    <div className="w-full flex gap-4">
      <div className="relative">
        <button
          onClick={() => setExpandedStep((prev) => (prev === 0 ? 1 : 0))}
          className={clsx(
            "absolute z-10 flex transition-all justify-center items-center w-[40px] h-[40px] top-1 bg-white rounded-full shadow-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed -right-[20px]"
          )}
        >
          {expandedStep === 0 ? (
            <ChevronRight size={24} />
          ) : (
            <ChevronLeft size={24} />
          )}
        </button>

        <Menubar
          className={clsx(
            "flex-col !h-fit border-0 p-0 !space-x-0", // 기존 css 제거
            "[&>button]:w-full [&>button]:cursor-pointer [&>button]:!py-0 [&>button]:!px-0 [&>button]:rounded-none bg-card drop-shadow-md", // 버튼 스타일 변경
            "[&>button:hover]:bg-accent [&>button:hover]:text-accent-foreground", // 버튼 hover시
            "[&>button>section]:transition-all [&>button>section]:text-left [&>button>section]:h-[50px] [&>button>section]:whitespace-nowrap [&>button>section]:flex [&>button>section]:items-center", // 메뉴 라벨
            expandedStep === 0 &&
              "[&>button>section]:w-0 [&>button>section]:opacity-0", // 메뉴 라벨 숨김
            expandedStep === 1 &&
              "[&>button>section]:w-[85px] [&>button>section]:opacity-1 [&>button>section]:pl-4" // 메뉴 라벨 표시
          )}
        >
          {map(
            [
              { path: AppRoute.AccountSetting, label: "정보변경" },
              { path: AppRoute.TetherSetting, label: "거래 관리" },
              { path: AppRoute.NotificationSetting, label: "알림 관리" },
            ],
            ({ path, label }) => (
              <MenubarMenu key={path}>
                <MenubarTrigger
                  onClick={() => router.push(path)}
                  className={getCurrentPathClassName(path)}
                  onMouseLeave={(event: any) =>
                    event.currentTarget.setAttribute("data-state", "closed")
                  }
                >
                  <section>{label}</section>
                </MenubarTrigger>
              </MenubarMenu>
            )
          )}
        </Menubar>
      </div>
      <div className="flex-1 pr-4">{props.children}</div>
    </div>
  );
};
