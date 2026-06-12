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
import { leaderboardUserGet, sessionGet, userGet } from "@/helpers/get";
import type { UserRankingResponse } from "@/app/api/leaderboard/user";
import {
  Bell,
  ChevronDown,
  LogOut,
  Mail,
  Menu,
  Monitor,
  Moon,
  SquareTerminal,
  Sun,
  User,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { ModeToggle } from "./ModeToggle";
import { UnstyledLogoutButton } from "@/components/1_atoms/UnstyledLogoutButton";
import { useRankEvaluation } from "@/helpers/customHook/useRankEvaluation";
import { LenBadge } from "@/components/1_atoms/LenBadge";
import { AlarmNavigation } from "@/components/1_atoms/MobileBottomNav";
import useEffectFunctionHook from "@/helpers/customHook/useEffectFunction";
import { NavPriceTicker } from "@/components/1_atoms/NavPriceTicker";
import { UserStatsBadge } from "@/components/1_atoms/UserStatsBadge";
import type { NavParentItem } from "@/helpers/server/navMenuRead";
import { useTetherEnabled } from "@/helpers/customHook/useTetherEnabled";

type ClientNavMenu = {
  title: string;
  href?: string;
  children?: { title: string; href?: string }[];
};

const toClientMenus = (items: NavParentItem[]): ClientNavMenu[] =>
  items.map((parent) => ({
    title: parent.label,
    href: parent.children.length > 0 ? undefined : parent.url || undefined,
    children:
      parent.children.length > 0
        ? parent.children.map((c) => ({
            title: c.label,
            href: c.url || undefined,
          }))
        : undefined,
  }));

export function TopNavigation({
  menuItems,
  showPriceTicker = true,
  showTradeRank = true,
  showBoardRank = true,
}: {
  menuItems: NavParentItem[];
  showPriceTicker?: boolean;
  showTradeRank?: boolean;
  showBoardRank?: boolean;
}) {
  const { data: session } = useGetQuery<Session | null | undefined, undefined>(
    {
      queryKey: [QueryKey.session],
    },
    sessionGet,
    undefined,
    { silent: true }
  );

  const { data: userData } = useGetQuery<UserAndSettings, undefined>(
    {
      queryKey: [QueryKey.account],
      enabled: !!session?.user,
    },
    userGet,
    undefined,
    { silent: true }
  );

  const tetherEnabled = useTetherEnabled();
  const showTradeStats = tetherEnabled && showTradeRank;

  const { data: rankingData } = useGetQuery<UserRankingResponse, undefined>(
    {
      queryKey: [QueryKey.leaderboardUser],
      enabled: !!session?.user && showTradeStats,
      staleTime: 60000,
    },
    leaderboardUserGet,
    undefined,
    { silent: true }
  );

  const { setTheme, theme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const visibleNavigationMenus = React.useMemo(
    () => toClientMenus(menuItems),
    [menuItems]
  );

  const rankEvaluation = useRankEvaluation();

  useEffectFunctionHook({
    Function: () => {
      setMounted(true);
    },
    dependency: [],
  });

  useEffectFunctionHook({
    Function: () => {
      if (session?.user) {
        rankEvaluation.mutate();
      }
    },
    dependency: [userData?.trade_count, session?.user],
  });

  // ── Mega menu state & refs ─────────────────────────────────────
  const [activeMenu, setActiveMenu] = React.useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = React.useState(false);
  const [panelLeft, setPanelLeft] = React.useState(0);
  const navContainerRef = React.useRef<HTMLDivElement>(null);
  const triggerRefs = React.useRef<Record<string, HTMLDivElement | null>>({});
  const closeTimerRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );

  const openPanel = (title: string) => {
    clearTimeout(closeTimerRef.current);
    setActiveMenu(title);
    setIsPanelOpen(true);
  };

  const scheduleClose = () => {
    closeTimerRef.current = setTimeout(() => {
      setIsPanelOpen(false);
      setActiveMenu(null);
    }, 100);
  };

  React.useEffect(() => {
    const updatePanelLeft = () => {
      const firstChildItem = visibleNavigationMenus.find((m) => m.children);
      if (!firstChildItem) return;
      const triggerEl = triggerRefs.current[firstChildItem.title];
      const containerEl = navContainerRef.current;
      if (!triggerEl || !containerEl) return;
      const containerRect = containerEl.getBoundingClientRect();
      const triggerRect = triggerEl.getBoundingClientRect();
      setPanelLeft(triggerRect.left - containerRect.left);
    };
    updatePanelLeft();
    window.addEventListener("resize", updatePanelLeft);
    return () => window.removeEventListener("resize", updatePanelLeft);
  }, [visibleNavigationMenus]);
  // ─────────────────────────────────────────────────────────────────

  const router = useRouter();
  const pathname = usePathname();
  return (
    <div className="bg-background border-b">
      <div
        ref={navContainerRef}
        className="relative flex items-center gap-2 xl:gap-4 py-2 px-4 xl:px-6 w-full max-w-[2000px] mx-auto"
      >
        <Logo href={AppRoute.Main} imgClassName="h-6 lg:h-10" />

        {/* Desktop Mega Menu — trigger row */}
        <div className="hidden lg:flex items-center">
          {map(visibleNavigationMenus, ({ title, href, children }) => (
            <div
              key={title}
              ref={(el) => {
                triggerRefs.current[title] = el;
              }}
              onMouseEnter={() =>
                children ? openPanel(title) : scheduleClose()
              }
            >
              {!children ? (
                href ? (
                  <Link
                    href={href}
                    target={href.startsWith("http") ? "_blank" : undefined}
                    rel={
                      href.startsWith("http")
                        ? "noopener noreferrer"
                        : undefined
                    }
                    className={cn(
                      "inline-flex h-10 w-max items-center justify-center rounded-md px-2 xl:px-4 py-2 text-sm font-medium transition-colors noto-sans-kr",
                      "hover:bg-accent hover:text-accent-foreground",
                      "focus:bg-accent focus:text-accent-foreground focus:outline-none"
                    )}
                  >
                    {title}
                  </Link>
                ) : (
                  <span
                    className={cn(
                      "inline-flex h-10 w-max items-center justify-center rounded-md px-2 xl:px-4 py-2 text-sm font-medium transition-colors noto-sans-kr",
                      "opacity-50 cursor-not-allowed pointer-events-none text-muted-foreground"
                    )}
                  >
                    {title}
                  </span>
                )
              ) : (
                <button
                  type="button"
                  className={cn(
                    "inline-flex h-10 w-max items-center justify-center rounded-md px-2 xl:px-4 py-2 text-sm font-medium transition-colors noto-sans-kr",
                    "hover:bg-accent hover:text-accent-foreground",
                    "focus:bg-accent focus:text-accent-foreground focus:outline-none",
                    isPanelOpen &&
                      activeMenu === title &&
                      "bg-accent text-accent-foreground"
                  )}
                >
                  {title}
                  <ChevronDown
                    className={cn(
                      "ml-1 h-3 w-3 transition-transform duration-200",
                      activeMenu === title && isPanelOpen && "rotate-180"
                    )}
                  />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Mega panel — all children columns side by side */}
        {isPanelOpen && (
          <div
            style={{ left: panelLeft }}
            className="absolute top-full z-50 mt-1.5 bg-popover border border-border rounded-md shadow-md animate-in fade-in-0 zoom-in-95 duration-150"
            onMouseEnter={() => clearTimeout(closeTimerRef.current)}
            onMouseLeave={scheduleClose}
          >
            <div className="flex p-6 gap-10">
              {visibleNavigationMenus
                .filter((m) => m.children)
                .map(({ title, children }) => (
                  <div
                    key={title}
                    className="flex flex-col min-w-[160px]"
                    onMouseEnter={() => setActiveMenu(title)}
                  >
                    <p
                      className={cn(
                        "text-xs font-semibold uppercase tracking-wider mb-3 pb-2 border-b noto-sans-kr",
                        activeMenu === title
                          ? "text-foreground border-primary"
                          : "text-muted-foreground border-border"
                      )}
                    >
                      {title}
                    </p>
                    <ul className="flex flex-col gap-1">
                      {children?.map((child) => (
                        <li key={child.title}>
                          {child.href ? (
                            <Link
                              href={child.href}
                              onClick={() => {
                                setIsPanelOpen(false);
                                setActiveMenu(null);
                              }}
                              target={
                                child.href.startsWith("http")
                                  ? "_blank"
                                  : undefined
                              }
                              rel={
                                child.href.startsWith("http")
                                  ? "noopener noreferrer"
                                  : undefined
                              }
                              className={cn(
                                "block rounded-md px-2 py-1.5 text-sm transition-colors noto-sans-kr",
                                "hover:bg-accent hover:text-accent-foreground",
                                activeMenu === title
                                  ? "text-foreground"
                                  : "text-muted-foreground"
                              )}
                            >
                              {child.title}
                            </Link>
                          ) : (
                            <span
                              className={cn(
                                "block rounded-md px-2 py-1.5 text-sm transition-colors noto-sans-kr",
                                "opacity-50 cursor-not-allowed pointer-events-none text-muted-foreground"
                              )}
                            >
                              {child.title}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
            </div>
          </div>
        )}
        {/* Mobile Price Ticker */}
        {showPriceTicker && (
          <div className="flex-1 min-w-0 lg:hidden">
            <NavPriceTicker />
          </div>
        )}
        <div className="ml-auto flex gap-2 items-center">
          <div className="hidden lg:flex gap-1 items-center min-h-8">
            {!mounted ? null : !(
                session !== null &&
                session !== undefined &&
                session.user?.displayname
              ) ? (
              <div className="flex gap-1 items-center">
                <Link href={AppRoute.Login}>
                  <Button variant="outline">로그인</Button>
                </Link>
                <Link href={AppRoute.Signup}>
                  <Button>회원가입</Button>
                </Link>
                <ModeToggle />
              </div>
            ) : (
              <>
                {(showTradeStats || showBoardRank) && (
                  <UserStatsBadge
                    showTrade={showTradeStats}
                    showBoard={showBoardRank}
                    rank_image={
                      userData?.profile?.current_rank_image ?? "bronze.png"
                    }
                    rank_name={userData?.profile?.current_rank_name ?? "브론즈"}
                    board_rank_image={
                      userData?.profile?.current_board_rank_image
                    }
                    board_rank_name={userData?.profile?.current_board_rank_name}
                    point={
                      userData?.profile?.point ?? session?.user?.point ?? 0
                    }
                    ranking_total={rankingData?.total?.ranking_point ?? 0}
                    ranking_weekly={rankingData?.weekly?.ranking_point ?? 0}
                    ranking_daily={rankingData?.daily?.ranking_point ?? 0}
                  />
                )}
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
                      <MenubarItem
                        onSelect={(e) => e.preventDefault()}
                        className="flex items-center justify-between gap-2"
                      >
                        <span className="text-sm">테마</span>
                        <div className="flex gap-0.5">
                          {(
                            [
                              { value: "light", icon: Sun },
                              { value: "dark", icon: Moon },
                              { value: "system", icon: Monitor },
                            ] as const
                          ).map(({ value, icon: Icon }) => (
                            <button
                              key={value}
                              type="button"
                              onClick={() => setTheme(value)}
                              className={cn(
                                "p-1 rounded transition-colors",
                                mounted && theme === value
                                  ? "bg-accent text-accent-foreground"
                                  : "text-muted-foreground hover:text-foreground"
                              )}
                            >
                              <Icon className="h-3.5 w-3.5" />
                            </button>
                          ))}
                        </div>
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
          </div>
          {/* Mobile Menu */}
          <div className="flex lg:hidden">
            {mounted &&
              session?.user?.auth &&
              admins.includes(session.user.auth) && (
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
                  {map(visibleNavigationMenus, ({ title, href, children }) => {
                    if (!children) {
                      return href ? (
                        <SheetClose key={title} asChild>
                          <Link
                            href={href}
                            target={
                              href.startsWith("http") ? "_blank" : undefined
                            }
                            rel={
                              href.startsWith("http")
                                ? "noopener noreferrer"
                                : undefined
                            }
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
                      ) : (
                        <span
                          key={title}
                          className="transition-colors text-foreground/50 cursor-not-allowed pointer-events-none"
                        >
                          {title}
                        </span>
                      );
                    }

                    if (children) {
                      return (
                        <div key={title} className="flex flex-col gap-2">
                          <div className="font-semibold text-muted-foreground">
                            {title}
                          </div>
                          <div className="pl-4 flex flex-col gap-2 border-l">
                            {map(children, (child) =>
                              child.href ? (
                                <SheetClose key={child.title} asChild>
                                  <Link
                                    href={child.href}
                                    target={
                                      child.href.startsWith("http")
                                        ? "_blank"
                                        : undefined
                                    }
                                    rel={
                                      child.href.startsWith("http")
                                        ? "noopener noreferrer"
                                        : undefined
                                    }
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
                              ) : (
                                <span
                                  key={child.title}
                                  className="transition-colors text-foreground/50 cursor-not-allowed pointer-events-none"
                                >
                                  {child.title}
                                </span>
                              )
                            )}
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
                          {(showTradeStats || showBoardRank) && (
                            <UserStatsBadge
                              variant="expanded"
                              showTrade={showTradeStats}
                              showBoard={showBoardRank}
                              rank_image={
                                userData?.profile?.current_rank_image ??
                                "bronze.png"
                              }
                              rank_name={
                                userData?.profile?.current_rank_name ?? "브론즈"
                              }
                              board_rank_image={
                                userData?.profile?.current_board_rank_image
                              }
                              board_rank_name={
                                userData?.profile?.current_board_rank_name
                              }
                              point={
                                userData?.profile?.point ??
                                session?.user?.point ??
                                0
                              }
                              ranking_total={
                                rankingData?.total?.ranking_point ?? 0
                              }
                              ranking_weekly={
                                rankingData?.weekly?.ranking_point ?? 0
                              }
                              ranking_daily={
                                rankingData?.daily?.ranking_point ?? 0
                              }
                            />
                          )}
                          <SheetClose asChild>
                            <button
                              onClick={() =>
                                router.push(AppRoute.AccountSetting)
                              }
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
    </div>
  );
}
