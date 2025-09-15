"use client";

import * as React from "react";
import Link from "next/link";

import { cn } from "@/components/lib/utils";
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
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import clsx from "clsx";
import { admins } from "@/helpers/config";
import {
  AdminAppRoute,
  AppRoute,
  QueryKey,
  type UserAndSettings,
} from "@/helpers/types";
import Logo from "@/components/1_atoms/Logo";
import { map } from "@/helpers/basic";
import { Button } from "@/components/ui/button";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import type { Session } from "next-auth";
import { sessionGet, userGet } from "@/helpers/get";
import {
  Bell,
  ChevronDown,
  LogOut,
  Mail,
  Menu,
  SquareTerminal,
  User,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { ModeToggle } from "./ModeToggle";
import { UnstyledLogoutButton } from "@/components/1_atoms/UnstyledLogoutButton";
import { useRankEvaluation } from "@/helpers/customHook/useRankEvaluation";
import { LenBadge } from "@/components/1_atoms/LenBadge";
import { AlarmNavigation } from "@/components/1_atoms/MobileBottomNav";
import useEffectFunctionHook from "@/helpers/customHook/useEffectFunction";
import { DisplayRank } from "@/components/1_atoms/DisplayRank";

const navigationMenus = [
  {
    title: "P2P 거래",
    href: "/board/tether",
  },
  { title: "정보공유", href: "/board/tips" },
  {
    title: "공지사항",
    href: "/board/notice",
  },
  {
    title: "테더뉴스",
    href: "/board/tether_news",
  },
  {
    title: "커뮤니티",
    children: [
      {
        title: "자유게시판",
        href: "/board/freedom",
      },
    ],
  },
  {
    title: "거래신고",
    href: "/board/trade_report",
  },
  { title: "이용 가이드", href: "/board/guide" },
  {
    title: "제휴업체",
    href: AppRoute.Partner,
  },
];

export function TopNavigation() {
  const { data: session } = useGetQuery<Session | null | undefined, undefined>(
    {
      queryKey: [QueryKey.session],
    },
    sessionGet
  );

  const { data: userData } = useGetQuery<UserAndSettings, undefined>(
    {
      queryKey: [QueryKey.account],
      enabled: !!session?.user,
    },
    userGet
  );

  const rankEvaluation = useRankEvaluation();

  useEffectFunctionHook({
    Function: () => {
      if (session?.user) {
        rankEvaluation.mutate();
      }
    },
    dependency: [userData?.trade_count, session?.user],
  });

  const router = useRouter();
  const pathname = usePathname();
  return (
    <div className="flex items-center gap-4 py-2 px-6 w-full mb-4 max-w-[2000px] mx-auto">
      <Logo href={AppRoute.Main} />
      {/* Desktop Menu */}
      <Menubar className="border-none shadow-none hidden lg:flex">
        {map(navigationMenus, ({ title, href, children }) => {
          if (href && !children) {
            return (
              <MenubarMenu key={title}>
                <MenubarTrigger
                  className={clsx("noto-sans-kr", "opacity-100 cursor-pointer")}
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
                    "opacity-100 cursor-pointer",
                    "[&[data-state=open]>svg]:rotate-180"
                  )}
                >
                  {title}
                  <ChevronDown className="w-[0.8rem] h-[0.8rem] ml-2 transition-transform duration-200" />
                </MenubarTrigger>
                <MenubarContent className="bg-accent border-input">
                  {map(children, (child) => (
                    <MenubarItem
                      key={child.title}
                      className={clsx(
                        "noto-sans-kr",
                        "opacity-100 cursor-pointer"
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
        <div className="hidden lg:flex gap-1">
          {!(
            session !== null &&
            session !== undefined &&
            session.user?.displayname
          ) ? (
            <div className="flex gap-1">
              <Link href={AppRoute.Login}>
                <Button variant="outline">로그인</Button>
              </Link>
              <Link href={AppRoute.Signup}>
                <Button>회원가입</Button>
              </Link>
            </div>
          ) : (
            <>
              <DisplayRank
                rank_level={userData?.profile?.current_rank_level ?? 1}
                rank_image={
                  userData?.profile?.current_rank_image ?? "bronze.png"
                }
                rank_name={userData?.profile?.current_rank_name ?? "브론즈"}
              />
              <Menubar className="p-0 border-input">
                <MenubarMenu>
                  <MenubarTrigger className="p-2 cursor-pointer">
                    <User className="h-[1.2rem] w-[1.2rem]" />
                    <span className="sr-only">옵션</span>
                  </MenubarTrigger>
                  <MenubarContent>
                    {session?.user?.auth &&
                      admins.includes(session.user.auth) && (
                        <MenubarItem asChild>
                          <Link
                            href={AdminAppRoute.Dashboard}
                            className="cursor-pointer"
                          >
                            어드민
                          </Link>
                        </MenubarItem>
                      )}
                    <MenubarItem
                      onClick={() => router.push(AppRoute.AccountSetting)}
                    >
                      마이 페이지
                    </MenubarItem>
                    <MenubarSeparator />
                    <MenubarItem>
                      <UnstyledLogoutButton className="w-full h-fit" />
                    </MenubarItem>
                  </MenubarContent>
                </MenubarMenu>
              </Menubar>
              <AlarmNavigation
                size="icon"
                variant="outline"
                className="z-10"
                contentClassName="w-[400px] h-[500px]"
              >
                <Bell className="h-[1.2rem] w-[1.2rem]" />
              </AlarmNavigation>
              <Button
                variant="outline"
                size="icon"
                type="button"
                className="relative"
                onClick={() =>
                  window.open(
                    AppRoute.MessageInbox,
                    "_blank",
                    "width=600,height=500,resizable=no,location=no,toolbar=no,menubar=no"
                  )
                }
              >
                <LenBadge len={userData?._count.message_inbox} />
                <Mail />
              </Button>
            </>
          )}
          <ModeToggle />
        </div>
        {/* Mobile Menu */}
        <div className="flex lg:hidden">
          {session?.user?.auth && admins.includes(session.user.auth) && (
            <Button
              variant="outline"
              size="icon"
              className="mr-1"
              onClick={() => router.push(AdminAppRoute.Dashboard)}
            >
              <SquareTerminal className="h-[1.2rem] w-[1.2rem]" />
              <span className="sr-only">Admin Page</span>
            </Button>
          )}

          {/* <DisplayRank
            className="mr-1"
            rank_level={userData?.profile?.current_rank_level ?? 1}
            rank_image={userData?.profile?.current_rank_image ?? "bronze.png"}
            rank_name={userData?.profile?.current_rank_name ?? "브론즈"}
          /> */}

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-[1.2rem] w-[1.2rem]" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="overflow-y-auto">
              <SheetHeader>
                <SheetTitle>메뉴</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-4 mt-6">
                {map(navigationMenus, ({ title, href, children }) => {
                  if (href && !children) {
                    return (
                      <SheetClose key={title} asChild>
                        <Link
                          href={href}
                          className={cn(
                            "transition-colors",
                            pathname === href
                              ? "font-medium text-foreground"
                              : "text-foreground/70 hover:text-muted-foreground"
                          )}
                        >
                          {title}
                        </Link>
                      </SheetClose>
                    );
                  }

                  if (children) {
                    return (
                      <div key={title} className="flex flex-col gap-2">
                        <div className="font-semibold text-muted-foreground">
                          {title}
                        </div>
                        <div className="pl-4 flex flex-col gap-2 border-l">
                          {map(children, (child) => (
                            <SheetClose key={child.title} asChild>
                              <Link
                                href={child.href}
                                className={cn(
                                  "transition-colors",
                                  pathname === child.href
                                    ? "font-medium text-foreground"
                                    : "text-foreground/70 hover:text-muted-foreground"
                                )}
                              >
                                {child.title}
                              </Link>
                            </SheetClose>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}

                {/* Theme Toggle Section */}
                <div className="mt-6 pt-6 border-t border-border">
                  <div className="flex flex-col gap-3 mb-2">
                    <div className="font-semibold text-foreground mb-1">
                      계정
                    </div>
                    {!(
                      session !== null &&
                      session !== undefined &&
                      session.user?.displayname
                    ) ? (
                      <>
                        <SheetClose asChild>
                          <Link
                            href={AppRoute.Login}
                            className={cn(
                              "flex items-center gap-2 px-4 py-2 rounded-md bg-primary/10 hover:bg-primary/20 transition-colors",
                              "text-primary font-medium"
                            )}
                          >
                            <User className="h-4 w-4" />
                            로그인
                          </Link>
                        </SheetClose>
                        <SheetClose asChild>
                          <Link
                            href={AppRoute.Signup}
                            className={cn(
                              "flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors",
                              "font-medium"
                            )}
                          >
                            <LogOut className="h-4 w-4" />
                            회원가입
                          </Link>
                        </SheetClose>
                      </>
                    ) : (
                      <>
                        <SheetClose asChild>
                          <button
                            onClick={() => router.push(AppRoute.AccountSetting)}
                            className={cn(
                              "flex items-start gap-2",
                              "transition-colors",
                              "text-foreground/70 hover:text-muted-foreground"
                            )}
                          >
                            마이 페이지
                          </button>
                        </SheetClose>
                        <SheetClose asChild>
                          <UnstyledLogoutButton
                            className={cn(
                              "transition-colors",
                              "text-foreground/70 hover:text-muted-foreground"
                            )}
                          />
                        </SheetClose>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-muted-foreground">
                            메시지
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            type="button"
                            className={cn(
                              "relative transition-colors text-start",
                              "text-foreground/70 hover:text-muted-foreground"
                            )}
                            onClick={() =>
                              window.open(
                                AppRoute.MessageInbox,
                                "_blank",
                                "width=600,height=500,resizable=no,location=no,toolbar=no,menubar=no"
                              )
                            }
                          >
                            <LenBadge len={userData?._count.message_inbox} />
                            <Mail className="h-[1.2rem] w-[1.2rem]" />
                            <span className="sr-only">Toggle theme</span>
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-muted-foreground">
                      테마
                    </span>
                    <ModeToggle />
                  </div>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
}
