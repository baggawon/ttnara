"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, List, Trash } from "lucide-react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);
import { AppRoute, MessageType } from "@/helpers/types";
import { Textarea } from "@/components/ui/textarea";
import { getNickname } from "@/helpers/common";
import MessageHistoryHook from "@/app/(app)/app/message/history/[messageId]/hook";

const MessageHistoryView = ({ messageId }: { messageId: string }) => {
  const {
    messageData,
    canPreview,
    canNext,
    goPreview,
    goNext,
    router,
    tryDelete,
    DeleteConfirmModal,
  } = MessageHistoryHook(messageId);

  return (
    <div className="relative w-full flex flex-col gap-4">
      {messageData && (
        <Card className="w-full">
          <CardContent className="relative flex py-2">
            <div className="flex flex-col gap-4">
              <p className="font-bold">{getNickname(messageData.to_uid)}</p>
              <p className="text-xs text-slate-600">
                {dayjs(messageData.created_at)
                  .tz("Asia/Seoul")
                  .format("YY-MM-DD HH:mm")}
              </p>
            </div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push(AppRoute.MessageHistory)}
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => tryDelete(messageData.id, MessageType.history)}
              >
                <Trash className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      {canPreview() || canNext() ? (
        <Card className="w-full">
          <CardContent className="relative flex !p-0 w-full">
            {canPreview() && (
              <Button
                type="button"
                variant="ghost"
                className="flex gap-2"
                onClick={goPreview}
              >
                <ChevronLeft className="w-4 h-4" /> 이전쪽지
              </Button>
            )}
            {canNext() && (
              <Button
                type="button"
                variant="ghost"
                className="flex gap-2 ml-auto"
                onClick={goNext}
              >
                다음쪽지 <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <></>
      )}
      {messageData && (
        <Textarea
          value={messageData.contents}
          readOnly
          className="w-full bg-card h-[187px]"
        />
      )}
      <div className="w-full flex justify-center gap-4">
        <Button
          variant="outline"
          type="button"
          onClick={() => window.close()}
          className="w-fit mb-4"
        >
          창닫기
        </Button>
      </div>
      {DeleteConfirmModal}
    </div>
  );
};

export default MessageHistoryView;
