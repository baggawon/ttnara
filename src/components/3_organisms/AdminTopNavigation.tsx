import * as React from "react";
import Link from "next/link";

import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from "@/components/ui/menubar";
import clsx from "clsx";
import { AdminAppRoute, AppRoute } from "@/helpers/types";
import { map } from "@/helpers/basic";
import Logo from "@/components/1_atoms/Logo";
import { ModeToggle } from "./ModeToggle";
import { User } from "lucide-react";
import { UnstyledLogoutButton } from "@/components/1_atoms/UnstyledLogoutButton";
import { ChevronDown } from "lucide-react";

const navigationMenus = [
  { title: "대시보드", href: AdminAppRoute.Dashboard },
  {
    title: "시스템 관리",
    children: [
      {
        title: "설정",
        href: AdminAppRoute.General,
      },
      {
        title: "사용자",
        href: AdminAppRoute.Users,
      },
      {
        title: "랭크",
        href: AdminAppRoute.Ranks,
      },
      {
        title: "협력사",
        href: AdminAppRoute.Partners,
        disable: false,
      },
      {
        title: "팝업",
        href: AdminAppRoute.Popup,
        disable: false,
      },
    ],
  },
  {
    title: "게시판",
    children: [
      {
        title: "개별 관리",
        href: AdminAppRoute.Boards,
      },
      {
        title: "기본 설정",
        href: AdminAppRoute.GeneralBoard,
      },
      {
        title: "거래 게시판",
        href: AdminAppRoute.TetherBoard,
      },
    ],
  },
  {
    title: "로그",
    disable: true,
    children: [
      { title: "보안", href: AdminAppRoute.Secret, disable: true },
      {
        title: "접속 기록",
        href: AdminAppRoute.ConnectHistory,
        disable: true,
      },
      {
        title: "관리자 기록",
        href: AdminAppRoute.ActionHistory,
        disable: true,
      },
    ],
  },
  { title: "개발팀 안내사항", href: AdminAppRoute.DevBoard, disable: true },
];
export function AdminTopNavigation() {
  return (
    <div className="flex items-center gap-4 py-2 px-6 w-full mb-4">
      <Logo href={AdminAppRoute.Dashboard} className="cursor-pointer" />

      <Menubar className="border-none shadow-none">
        {map(navigationMenus, ({ title, href, disable, children }) => {
          if (href && !children) {
            return (
              <MenubarMenu key={title}>
                <MenubarTrigger
                  className={clsx(
                    "noto-sans-kr",
                    disable === true
                      ? "opacit y-50 cursor-not-allowed pointer-events-none"
                      : "opacity-100 cursor-pointer"
                  )}
                  asChild
                >
                  <Link href={href}>{title}</Link>
                </MenubarTrigger>
              </MenubarMenu>
            );
          }

          if (children) {
            return (
              <MenubarMenu key={title}>
                <MenubarTrigger
                  className={clsx(
                    "noto-sans-kr",
                    disable === false
                      ? "opacity-50 cursor-not-allowed pointer-events-none"
                      : "opacity-100 cursor-pointer",
                    "[&[data-state=open]>svg]:rotate-180"
                  )}
                >
                  {title}
                  <ChevronDown className="w-[0.8rem] h-[0.8rem] ml-2 transition-transform duration-200" />
                </MenubarTrigger>
                <MenubarContent>
                  {map(children, (child) => (
                    <MenubarItem
                      key={child.title}
                      className={clsx(
                        "noto-sans-kr",
                        child.disable === true
                          ? "opacity-50 cursor-not-allowed pointer-events-none"
                          : "opacity-100 cursor-pointer"
                      )}
                      asChild
                    >
                      <Link href={child.href}>{child.title}</Link>
                    </MenubarItem>
                  ))}
                </MenubarContent>
              </MenubarMenu>
            );
          }

          return null;
        })}
      </Menubar>

      <div className="ml-auto flex gap-2 items-center">
        <Menubar className="p-0 border-input">
          <MenubarMenu>
            <MenubarTrigger className="p-2 cursor-pointer">
              <User className="h-[1.2rem] w-[1.2rem]" />
              <span className="sr-only">옵션</span>
            </MenubarTrigger>
            <MenubarContent>
              <MenubarItem asChild>
                <Link href={AppRoute.Main} className="cursor-pointer">
                  유저 페이지
                </Link>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem>
                <UnstyledLogoutButton className="w-full h-fit" />
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
        <ModeToggle />
      </div>
    </div>
  );
}
