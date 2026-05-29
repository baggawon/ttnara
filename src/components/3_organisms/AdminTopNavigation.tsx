"use client";

import * as React from "react";
import { useState } from "react";
import Link from "next/link";

import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from "@/components/ui/menubar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import clsx from "clsx";
import { AdminAppRoute, AppRoute } from "@/helpers/types";
import { map } from "@/helpers/basic";
import Logo from "@/components/1_atoms/Logo";
import { ModeToggle } from "./ModeToggle";
import { ChevronDown, Menu, User } from "lucide-react";
import { UnstyledLogoutButton } from "@/components/1_atoms/UnstyledLogoutButton";

interface NavChild {
  title: string;
  href: string;
  disable?: boolean;
  disabledReason?: string;
}

interface NavMenu {
  title: string;
  href?: string;
  disable?: boolean;
  disabledReason?: string;
  children?: NavChild[];
}

const buildNavigationMenus = (hasFullviewTopic: boolean): NavMenu[] => [
  { title: "대시보드", href: AdminAppRoute.Dashboard },
  {
    title: "시스템 관리",
    children: [
      { title: "설정", href: AdminAppRoute.General },
      { title: "사용자", href: AdminAppRoute.Users },
      { title: "등급", href: AdminAppRoute.Ranks },
      { title: "협력사 배너", href: AdminAppRoute.Partners, disable: false },
      { title: "공식보증업체", href: AdminAppRoute.Guarantee, disable: false },
      { title: "팝업", href: AdminAppRoute.Popup, disable: false },
      { title: "푸시 알림", href: AdminAppRoute.PushNotification },
      { title: "거래 시스템 제어", href: AdminAppRoute.SystemControl },
      { title: "메뉴 관리", href: AdminAppRoute.Navigation },
      { title: "고객센터", href: AdminAppRoute.Support },
      { title: "이메일 양식", href: AdminAppRoute.EmailTemplates },
    ],
  },
  {
    title: "게시판",
    children: [
      { title: "개별 관리", href: AdminAppRoute.Boards },
      { title: "기본 설정", href: AdminAppRoute.GeneralBoard },
      { title: "거래 게시판", href: AdminAppRoute.TetherBoard },
    ],
  },
  {
    title: "홈 게시판",
    disable: !hasFullviewTopic,
    disabledReason:
      "메인 홈 카드형 게시판으로 지정된 게시판이 있어야 사용할 수 있습니다.",
    children: [
      {
        title: "이벤트 리스트",
        href: AdminAppRoute.Featured,
        disable: !hasFullviewTopic,
      },
    ],
  },
  { title: "채팅", href: AdminAppRoute.Chat },
  {
    title: "로그",
    disable: true,
    children: [
      { title: "보안", href: AdminAppRoute.Secret, disable: true },
      { title: "접속 기록", href: AdminAppRoute.ConnectHistory, disable: true },
      {
        title: "관리자 기록",
        href: AdminAppRoute.ActionHistory,
        disable: true,
      },
    ],
  },
  { title: "개발팀 안내사항", href: AdminAppRoute.DevBoard, disable: true },
];

export function AdminTopNavigation({
  hasFullviewTopic = false,
}: {
  hasFullviewTopic?: boolean;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigationMenus = buildNavigationMenus(hasFullviewTopic);

  return (
    <div className="flex items-center gap-2 sm:gap-4 py-2 px-3 sm:px-6 w-full mb-4">
      {/* Mobile hamburger — replaces the horizontal menubar below `lg`. */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            aria-label="메뉴 열기"
            className="lg:hidden p-2 -ml-1 text-muted-foreground hover:text-foreground"
          >
            <Menu className="w-5 h-5" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>관리자 메뉴</SheetTitle>
          </SheetHeader>
          <nav className="p-2">
            <MobileNav
              onNavigate={() => setMobileOpen(false)}
              navigationMenus={navigationMenus}
            />
          </nav>
        </SheetContent>
      </Sheet>

      <Logo
        href={AdminAppRoute.Dashboard}
        className="cursor-pointer shrink-0"
      />

      {/* Desktop horizontal menubar — hidden below `lg`. */}
      <Menubar className="border-none shadow-none hidden lg:flex">
        {map(
          navigationMenus,
          ({ title, href, disable, disabledReason, children }) => {
            if (href && !children) {
              return (
                <MenubarMenu key={title}>
                  <MenubarTrigger
                    className={clsx(
                      "noto-sans-kr",
                      disable === true
                        ? "opacity-50 cursor-not-allowed"
                        : "opacity-100 cursor-pointer"
                    )}
                    asChild
                  >
                    {disable === true ? (
                      <span title={disabledReason}>{title}</span>
                    ) : (
                      <Link href={href}>{title}</Link>
                    )}
                  </MenubarTrigger>
                </MenubarMenu>
              );
            }

            if (children) {
              return (
                <MenubarMenu key={title}>
                  <MenubarTrigger
                    title={disable === true ? disabledReason : undefined}
                    className={clsx(
                      "noto-sans-kr",
                      disable === true
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
                        {child.disable === true ? (
                          <span>{child.title}</span>
                        ) : (
                          <Link href={child.href}>{child.title}</Link>
                        )}
                      </MenubarItem>
                    ))}
                  </MenubarContent>
                </MenubarMenu>
              );
            }

            return null;
          }
        )}
      </Menubar>

      <div className="ml-auto flex gap-1 sm:gap-2 items-center shrink-0">
        <Menubar className="p-0 border-input">
          <MenubarMenu>
            <MenubarTrigger className="p-2 cursor-pointer">
              <User className="h-[1.2rem] w-[1.2rem]" />
              <span className="sr-only">옵션</span>
            </MenubarTrigger>
            <MenubarContent>
              <MenubarItem>
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

/**
 * Vertical, collapsible variant of `navigationMenus` rendered inside the
 * mobile drawer. Disabled entries are dimmed and unclickable; grouped
 * entries collapse via Accordion.
 */
function MobileNav({
  onNavigate,
  navigationMenus,
}: {
  onNavigate: () => void;
  navigationMenus: NavMenu[];
}) {
  return (
    <ul className="flex flex-col gap-0.5">
      {navigationMenus.map((menu) => {
        if (menu.children) {
          // Whole-group disable: greys the trigger but still allows expanding
          // so admins can see what's coming. Individual children may also be
          // disabled.
          return (
            <li key={menu.title}>
              <Accordion type="single" collapsible>
                <AccordionItem value={menu.title} className="border-none">
                  <AccordionTrigger
                    className={clsx(
                      "px-3 py-2 text-sm font-medium hover:no-underline rounded-md",
                      menu.disable === true
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-accent"
                    )}
                  >
                    {menu.title}
                  </AccordionTrigger>
                  <AccordionContent className="pb-1">
                    <ul className="flex flex-col">
                      {menu.children.map((child) => (
                        <li key={child.title}>
                          {child.disable ? (
                            <span className="block px-6 py-2 text-sm text-muted-foreground opacity-50 cursor-not-allowed">
                              {child.title}
                            </span>
                          ) : (
                            <Link
                              href={child.href}
                              onClick={onNavigate}
                              className="block px-6 py-2 text-sm rounded-md hover:bg-accent"
                            >
                              {child.title}
                            </Link>
                          )}
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </li>
          );
        }

        if (menu.href) {
          return (
            <li key={menu.title}>
              {menu.disable ? (
                <span
                  title={menu.disabledReason}
                  className="block px-3 py-2 text-sm font-medium text-muted-foreground opacity-50 cursor-not-allowed"
                >
                  {menu.title}
                  {menu.disabledReason && (
                    <span className="block mt-0.5 text-[11px] text-muted-foreground/80">
                      {menu.disabledReason}
                    </span>
                  )}
                </span>
              ) : (
                <Link
                  href={menu.href}
                  onClick={onNavigate}
                  className="block px-3 py-2 text-sm font-medium rounded-md hover:bg-accent"
                >
                  {menu.title}
                </Link>
              )}
            </li>
          );
        }

        return null;
      })}
    </ul>
  );
}
