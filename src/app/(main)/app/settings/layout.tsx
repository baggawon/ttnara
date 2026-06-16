"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import { SidebarNav } from "@/components/1_atoms/SidebarNavigation";
import { AppRoute } from "@/helpers/types";
import { Separator } from "@/components/ui/separator";
import {
  Activity,
  Bell,
  BellRing,
  Coins,
  File,
  Trophy,
  User,
  UserRoundSearch,
} from "lucide-react";
import { useTetherEnabled } from "@/helpers/customHook/useTetherEnabled";

const allSidebarNavItems = [
  {
    title: "거래 관리",
    href: AppRoute.TetherSetting,
    icon: <File />,
    tetherOnly: true,
  },
  {
    title: "등급",
    href: AppRoute.RankSetting,
    icon: <Trophy />,
  },
  {
    title: "알림 내역",
    href: AppRoute.NotificationList,
    icon: <BellRing />,
  },
  {
    title: "알림 설정",
    href: AppRoute.NotificationSetting,
    icon: <Bell />,
  },
  {
    title: "KYC 인증",
    href: AppRoute.KYCSetting,
    icon: <UserRoundSearch />,
    tetherOnly: true,
  },
  {
    title: "게시판 포인트",
    href: AppRoute.PointSetting,
    icon: <Coins />,
  },
  {
    title: "내 게시판 활동",
    href: AppRoute.BoardActivity,
    icon: <Activity />,
  },
  {
    title: "내 정보",
    href: AppRoute.AccountSetting,
    icon: <User />,
  },
];

export default function Layout(props: { children: ReactNode }) {
  const tetherEnabled = useTetherEnabled();

  const sidebarNavItems = useMemo(
    () =>
      allSidebarNavItems
        .filter((item) => tetherEnabled || !item.tetherOnly)
        .map(({ tetherOnly: _t, ...rest }) => rest),
    [tetherEnabled]
  );

  return (
    <div className="w-full pt-4 pb-28 lg:pb-10 space-y-6">
      <div className="space-y-0.5 px-2 lg:px-0">
        <h2 className="text-2xl font-bold tracking-tight">마이 페이지</h2>
        <p className="text-muted-foreground">알림 및 계정 설정을 관리합니다.</p>
      </div>
      <Separator />
      <div className="flex flex-col gap-6">
        <div className="px-2 lg:px-0">
          <SidebarNav items={sidebarNavItems} />
        </div>
        <div className="min-w-0">{props.children}</div>
      </div>
    </div>
  );
}
