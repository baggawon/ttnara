"use client";

import { useToast } from "@/components/ui/use-toast";
import { ApiRoute, AppRoute, TetherStatus } from "@/helpers/types";
import useLoadingHandler from "@/helpers/customHook//useLoadingHandler";
import type { TetherPublicWithProfile } from "@/app/api/tethers/read";
import { get } from "@/helpers/common";
import { useRouter } from "next/navigation";
import type { Session } from "next-auth";
import { ToastData } from "@/helpers/toastData";

export const useTetherGoDetail = (session: Session | null | undefined) => {
  const canWrite = session?.user !== null && session?.user !== undefined;

  const router = useRouter();

  const { toast } = useToast();

  useLoadingHandler();

  const goDetail = async (tether: TetherPublicWithProfile) => {
    if (!canWrite) {
      toast({
        id: ToastData.tetherNeedLogin,
        type: "error",
      });
      return;
    }

    const owner =
      canWrite &&
      session?.user?.displayname === tether.user?.profile?.displayname;

    if (owner) {
      router.push(`${AppRoute.Threads}/tether/${tether.id}`);
      return;
    }

    if (tether.status === TetherStatus.Open) {
      if (tether.use_author && session.user.kyc_id === null) {
        toast({
          id: ToastData.tetherNeedKYC,
          type: "error",
        });
        return;
      }
      router.push(`${AppRoute.Threads}/tether/${tether.id}`);
      return;
    } else if (
      [TetherStatus.Complete, TetherStatus.Progress].includes(
        tether.status as TetherStatus
      )
    ) {
      const { hasData } = await get(ApiRoute.tethersRead, {
        query: {
          id: tether.id,
        },
      });

      if (hasData?.tethers.length > 0) {
        router.push(`${AppRoute.Threads}/tether/${tether.id}`);
        return;
      }
      toast({
        id:
          tether.status === TetherStatus.Complete
            ? ToastData.tetherAlreadyComplete
            : ToastData.tetherProgress,
        type: "error",
      });
      return;
    }
  };

  return { goDetail, passwordModal: null };
};
