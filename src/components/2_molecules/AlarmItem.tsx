"use client";

import { get, postJson, refreshCache } from "@/helpers/common";
import { AlarmTypes, ApiRoute, TetherStatus } from "@/helpers/types";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import { Handshake, Mail } from "lucide-react";
import type { alarm } from "@prisma/client";
import type { alarmUpdateProps } from "@/app/api/alarm/update";
import { useToast } from "@/components/ui/use-toast";
import useLoadingHandler from "@/helpers/customHook/useLoadingHandler";
import { ToastData } from "@/helpers/toastData";

const AlarmItem = ({ alarm }: { alarm: alarm }) => {
  const router = useRouter();

  const { toast } = useToast();

  const { queryClient } = useLoadingHandler();

  const getIcon = (type: string) => {
    switch (type as AlarmTypes) {
      case AlarmTypes.Message:
        return <Mail className="w-4 h-4" />;
      case AlarmTypes.P2PComplete:
      case AlarmTypes.P2PCancel:
      case AlarmTypes.P2POwnerCancel:
      case AlarmTypes.P2PProgress:
      case AlarmTypes.P2PProposalCancel:
        return <Handshake className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const readMessage = async (alarm: alarm) => {
    const { isSuccess, hasMessage } = await postJson<alarmUpdateProps>(
      ApiRoute.alarmUpdate,
      {
        id: [alarm.id],
        is_read: true,
      }
    );
    if (isSuccess) {
      refreshCache(queryClient);
      return true;
    } else if (hasMessage) {
      toast({ id: hasMessage, type: "error" });
    }
    return false;
  };

  const actionUrlClick = async () => {
    let readResult = false;
    let readData;
    let id = 0;

    switch (alarm.type as AlarmTypes) {
      case AlarmTypes.Message:
        window.open(
          alarm.url,
          "_blank",
          "width=600,height=500,resizable=no,location=no,toolbar=no,menubar=no"
        );
        break;
      case AlarmTypes.P2PComplete:
      case AlarmTypes.P2PCancel:
      case AlarmTypes.P2PProgress:
      case AlarmTypes.P2PProposalCancel:
      case AlarmTypes.P2POwnerCancel:
        id = Number(alarm.url.split("/").at(-1));
        readData = await get(ApiRoute.tethersRead, {
          query: {
            id,
          },
        });
        if (alarm.is_read === false) {
          readResult = await readMessage(alarm);
        } else {
          readResult = true;
        }
        if (
          readData?.hasData &&
          readData.hasData?.tethers?.[0]?.status === TetherStatus.Cancel
        ) {
          toast({
            id: ToastData.tetherAlreadyCancel,
            type: "error",
          });
        } else if (readResult) router.push(alarm.url);
        break;
    }
  };

  return (
    <button
      className="py-4 border-b border-border w-full text-left h-[96px]"
      type="button"
      onClick={actionUrlClick}
    >
      <div className="flex items-start gap-4 relative">
        <div className="relative flex items-center justify-center flex-col gap-2">
          {getIcon(alarm.type)}
        </div>
        <div className="flex-1">
          <h3 className="font-medium w-full flex justify-between">
            {alarm.title}
            {!alarm.is_read && (
              <span className="bg-red-500 w-2 h-2 rounded-full" />
            )}
          </h3>
          <p className="text-sm mt-1">{alarm.body}</p>
          <p className="text-xs mt-1 opacity-50">
            {dayjs(alarm.created_at).format("YYYY-MM-DD HH:mm")}
          </p>
        </div>
      </div>
    </button>
  );
};

export default AlarmItem;
