"use client";

import React, { useRef } from "react";
import { useLoadingStore, useSessionStore } from "@/helpers/state";
import useEffectFunctionHook from "@/helpers/customHook/useEffectFunction";
import { signOut } from "@/helpers/common";
import useLoadingHandler from "@/helpers/customHook/useLoadingHandler";
import { BroadcastChannels, BroadcastEvents, QueryKey } from "@/helpers/types";
import type { Session } from "next-auth";

const SessionManage = () => {
  const sessionStore = useSessionStore((state) => state);

  useEffectFunctionHook({
    Function: async () => {
      if (sessionStore.needLogout) {
        await signOut();
        useLoadingStore.getState().clearLoading();
        sessionStore.loginRequest();
      }
    },
    dependency: [sessionStore.needLogout],
  });

  const { queryClient } = useLoadingHandler();

  const channel = useRef<BroadcastChannel | null>(null);
  useEffectFunctionHook({
    Function: () => {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        channel.current = new BroadcastChannel(BroadcastChannels.Auth);

        channel.current.onmessage = (event) => {
          if (
            event.data === BroadcastEvents.SignOut ||
            event.data === BroadcastEvents.SignIn
          ) {
            // 다른 탭/창에서 로그아웃 이벤트가 발생했을 때 이 탭/창도 로그아웃
            setTimeout(async () => {
              const session = queryClient.getQueryData<
                Session | null | undefined
              >([QueryKey.session]);
              if (
                (event.data === BroadcastEvents.SignOut && session?.user) ||
                (event.data === BroadcastEvents.SignIn &&
                  session &&
                  Object.keys(session).length === 0)
              ) {
                window.location.reload();
              }
            }, 2000);
          }
        };
      }
    },
    Unmount: () => {
      channel.current?.close();
    },
    dependency: [],
  });

  return <></>;
};

export default SessionManage;
