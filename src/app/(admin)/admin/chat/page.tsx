"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import clsx from "clsx";

import SettingsTab from "./_components/SettingsTab";
import TopicsTab from "./_components/TopicsTab";
import NoticesTab from "./_components/NoticesTab";
import BannedWordsTab from "./_components/BannedWordsTab";
import MutedTab from "./_components/MutedTab";
import BannedTab from "./_components/BannedTab";
import HiddenTab from "./_components/HiddenTab";
import ReportsTab from "./_components/ReportsTab";
import FixedMessagesTab from "./_components/FixedMessagesTab";
import HistoryTab from "./_components/HistoryTab";
import SpamUsersTab from "./_components/SpamUsersTab";

const tabs = [
  { id: "settings", label: "설정" },
  { id: "topics", label: "채팅 토픽" },
  { id: "notices", label: "공지 (캐러셀)" },
  { id: "banned-words", label: "금지어" },
  { id: "fixed", label: "고정 메시지" },
  { id: "history", label: "채팅 기록" },
  { id: "spam", label: "스팸 유저" },
  { id: "muted", label: "뮤트 유저" },
  { id: "banned", label: "차단 유저" },
  { id: "hidden", label: "숨김 메시지" },
  { id: "reports", label: "신고 내역" },
];

export default function ChatAdminPage() {
  const [activeTab, setActiveTab] = useState("settings");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">채팅 관리</h2>
        <p className="text-muted-foreground">
          라이브 채팅 시스템을 관리합니다.
        </p>
      </div>
      <Separator />

      <div className="flex gap-1 border-b pb-1 overflow-x-auto whitespace-nowrap md:flex-wrap md:overflow-visible md:whitespace-normal">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "default" : "ghost"}
            size="sm"
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              "text-xs shrink-0",
              activeTab === tab.id && "shadow-sm"
            )}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {activeTab === "settings" && <SettingsTab />}
      {activeTab === "topics" && <TopicsTab />}
      {activeTab === "notices" && <NoticesTab />}
      {activeTab === "banned-words" && <BannedWordsTab />}
      {activeTab === "fixed" && <FixedMessagesTab />}
      {activeTab === "history" && <HistoryTab />}
      {activeTab === "spam" && <SpamUsersTab />}
      {activeTab === "muted" && <MutedTab />}
      {activeTab === "banned" && <BannedTab />}
      {activeTab === "hidden" && <HiddenTab />}
      {activeTab === "reports" && <ReportsTab />}
    </div>
  );
}
