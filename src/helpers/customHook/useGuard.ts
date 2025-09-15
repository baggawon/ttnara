"use client";

import { useSession } from "next-auth/react";
import useEffectFunctionHook from "@/helpers/customHook/useEffectFunction";
import { admins, canWriteTopics } from "@/helpers/config";
import { useRouter } from "next/navigation";

export const useAdminGuard = (topic_url?: string) => {
  const router = useRouter();
  const session = useSession();
  useEffectFunctionHook({
    Function: () => {
      if (session?.data) {
        const canWrite =
          admins.includes(session?.data?.user?.auth ?? "") ||
          (topic_url &&
            canWriteTopics.includes(topic_url) &&
            session?.data?.user &&
            session.data.user !== null);

        if (!canWrite) {
          router.back();
        }
      } else if (session?.data === null) {
        router.back();
      }
    },
    dependency: [session, topic_url],
  });
};

export const useUserGuard = () => {
  const router = useRouter();
  const session = useSession();
  useEffectFunctionHook({
    Function: () => {
      if (session?.data) {
        const canWrite = session?.data?.user && session.data.user !== null;

        if (!canWrite) {
          router.back();
        }
      } else if (session?.data === null) {
        router.back();
      }
    },
    dependency: [session],
  });
};
