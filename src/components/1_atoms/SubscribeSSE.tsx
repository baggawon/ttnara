"use client";

import { useRef } from "react";

import useEffectFunctionHook from "@/helpers/customHook/useEffectFunction";
import useLoadingHandler from "@/helpers/customHook/useLoadingHandler";
import useGetQuery from "../../helpers/customHook/useGetQuery";
import { QueryKey } from "@/helpers/types";
import type { Session } from "next-auth";
import { sessionGet } from "@/helpers/get";
import type { UserUpdateEvent } from "@/lib/eventEmitter";
import { refreshCache } from "@/helpers/common";

const SubscribeSSE = () => {
  const { queryClient } = useLoadingHandler();
  const eventSourceRef = useRef<EventSource | null>(null);

  const { data: session } = useGetQuery<Session | null | undefined, undefined>(
    {
      queryKey: [QueryKey.session],
    },
    sessionGet
  );

  useEffectFunctionHook({
    Function: () => {
      if (!session?.user.id) return;
      const userId = session.user.id;

      if (!userId) return;

      let retryCount = 0;
      const maxRetries = 3;

      const connectEventSource = () => {
        // Close existing connection if any
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }

        // Add a try-catch block to prevent console errors
        try {
          // Create new EventSource with error handling
          const eventSource = new EventSource(`/api/sse?userId=${userId}`);
          eventSourceRef.current = eventSource;

          eventSource.onmessage = (event) => {
            try {
              const newData: UserUpdateEvent = JSON.parse(event.data);
              refreshCache(queryClient, newData.data.queryKey);
            } catch (error) {
              // Silently handle parsing errors
              console.debug("Error handling SSE message:", error);
            }
          };

          // Modify the error handler to be silent
          eventSource.onerror = (_error) => {
            // Don't output to console to hide the error
            eventSource.close();

            if (retryCount < maxRetries) {
              retryCount++;
              setTimeout(connectEventSource, 1000 * retryCount);
            }
          };
        } catch (err) {
          // Silently handle any errors during connection setup
        }
      };

      connectEventSource();
    },
    Unmount: () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    },
    dependency: [session, queryClient],
  });

  return <></>;
};

export default SubscribeSSE;
