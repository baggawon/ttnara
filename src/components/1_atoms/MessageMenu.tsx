"use client";

import type { MessageDatas } from "@/helpers/types";
import { AppRoute, QueryKey } from "@/helpers/types";
import { usePathname, useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import useEffectFunctionHook from "@/helpers/customHook/useEffectFunction";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import type { MessageReadProps } from "@/app/api/message/read";
import { messageGet } from "@/helpers/get";

const MessageMenu = () => {
  const pathname = usePathname();
  const router = useRouter();
  const getTitle = () => {
    if (
      [AppRoute.MessageInbox, AppRoute.MessageHistory].includes(
        pathname as AppRoute
      )
    )
      return "내 쪽지함";
    if (pathname === AppRoute.MessagePost) return "쪽지 보내기";

    if (pathname.startsWith(AppRoute.MessageInbox)) return "받은 쪽지 보기";
    return "보낸 쪽지 보기";
  };

  const [tab, setTab] = useState<AppRoute>(AppRoute.MessageInbox);

  const getAppRoute = (pathname: string) => {
    if (pathname === AppRoute.MessagePost) return AppRoute.MessagePost;
    if (pathname.startsWith(AppRoute.MessageHistory))
      return AppRoute.MessageHistory;
    return AppRoute.MessageInbox;
  };

  const onChangeTab = (value: string) => {
    if (tab !== getAppRoute(value)) {
      setTab(getAppRoute(value));
      router.push(value);
    }
  };

  const onClickTab = () => {
    if (getAppRoute(pathname) === tab && pathname !== tab) router.push(tab);
  };

  useEffectFunctionHook({
    Function: () => {
      if (pathname) setTab(getAppRoute(pathname));
    },
    dependency: [pathname],
  });

  useGetQuery<MessageDatas, MessageReadProps>(
    {
      queryKey: [QueryKey.message],
    },
    messageGet,
    { history: true, inbox: true }
  );

  return (
    <nav className="sticky top-0 z-[40]">
      <div className="flex justify-center bg-background border-b-2">
        <div className="py-4 px-8 shadow-sm w-full flex justify-start">
          <Label className="text-lg font-bold">{getTitle()}</Label>
        </div>
      </div>
      <div className="flex justify-center">
        <Tabs
          value={tab}
          onClick={onClickTab}
          onValueChange={onChangeTab}
          className="w-full p-4  bg-background"
        >
          <TabsList>
            <TabsTrigger value={AppRoute.MessageInbox}>받은쪽지</TabsTrigger>
            <TabsTrigger value={AppRoute.MessageHistory}>보낸쪽지</TabsTrigger>
            <TabsTrigger value={AppRoute.MessagePost}>쪽지쓰기</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </nav>
  );
};

export default MessageMenu;
