"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { SidebarNav } from "@/components/1_atoms/SidebarNavigation";
import { AppRoute } from "@/helpers/types";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/components/lib/utils";
import { Bell, BellRing, File, User, UserRoundSearch } from "lucide-react";

const sidebarNavItems = [
  {
    title: "거래 관리",
    href: AppRoute.TetherSetting,
    icon: <File />,
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
  },
  {
    title: "내 정보",
    href: AppRoute.AccountSetting,
    icon: <User />,
  },
];

export default function Layout(props: { children: ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const handleSidebarToggle = (collapsed: boolean) => {
    setIsSidebarCollapsed(collapsed);
  };

  return (
    <div className="space-y-6 p-0 md:p-10 pb-16 w-full">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">마이 페이지</h2>
        <p className="text-muted-foreground">
          거래, 알림 및 계정 설정을 관리합니다.
        </p>
      </div>
      <Separator className="my-6" />
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside
          className={cn("mx-0", isSidebarCollapsed ? "lg:w-12" : "lg:w-1/7")}
        >
          <SidebarNav
            items={sidebarNavItems}
            onCollapseToggle={handleSidebarToggle}
          />
        </aside>
        <div className="flex-1">{props.children}</div>
      </div>
    </div>
  );
}
