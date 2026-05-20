"use client";

import clsx from "clsx";
import { useChatStore } from "@/helpers/chatStore";
import { ChatWidget } from "./ChatWidget";

export const ResponsiveChatWidget = () => {
  const isOpen = useChatStore((s) => s.isOpen);

  return (
    <div
      className={clsx(
        "fixed inset-x-2 top-2 bottom-[80px] z-40",
        isOpen ? "block" : "hidden",
        "lg:block lg:static lg:inset-x-auto lg:top-auto lg:bottom-auto lg:z-auto lg:h-fit lg:shrink-0 lg:self-start lg:mt-4"
      )}
    >
      <ChatWidget />
    </div>
  );
};
