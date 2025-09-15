import type { Message, MessageDatas } from "@/helpers/types";
import { AppRoute, MessageType, QueryKey } from "@/helpers/types";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import { messageGet } from "@/helpers/get";
import type { MessageReadProps } from "@/app/api/message/read";
import { useRouter } from "next/navigation";
import useMessageDelete from "@/helpers/customHook/useMessageDelete";
import type { CustomColumDef } from "@/components/2_molecules/Table/DataTable";
import { ElipsisText } from "@/components/1_atoms/ElipsisText";
import { Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { convertMessageData } from "@/app/(app)/app/message/inbox/utils";

const MessageInboxHook = () => {
  const router = useRouter();

  const { data: messagesData } = useGetQuery<MessageDatas, MessageReadProps>(
    {
      queryKey: [QueryKey.message],
      select: (data) => ({
        history: convertMessageData(data.history, "to_uid"),
        inbox: convertMessageData(data.inbox, "from_uid"),
      }),
    },
    messageGet,
    { history: true, inbox: true }
  );

  const { tryDelete, DeleteConfirmModal } = useMessageDelete();

  const columns: CustomColumDef<Message>[] = [
    {
      accessorKey: "messageData",
      cell: ({ getValue, row }) => {
        const [nickname, createdDate, contents] = getValue().split("\n");
        return (
          <div className="flex flex-col gap-4">
            <div className="flex gap-4 items-center">
              <p className="font-bold">{nickname}</p>
              <p className="text-xs text-slate-600">{createdDate}</p>
            </div>
            <button
              type="button"
              onClick={() =>
                router.push(`${AppRoute.MessageInbox}/${row.original.id}`)
              }
              className="hover:underline text-left"
            >
              <ElipsisText text={contents} />
            </button>
          </div>
        );
      },
    },
    {
      accessorKey: "control",
      cell: ({ row }) => (
        <div className="relative">
          <Button
            type="button"
            variant="ghost"
            className="absolute right-4 top-1/2 -translate-y-1/2"
            onClick={() => tryDelete(row.original.id, MessageType.inbox)}
          >
            <Trash className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  const onRowClassName = (message: Message) =>
    !message.is_read ? "bg-muted" : "";

  return { columns, messagesData, onRowClassName, DeleteConfirmModal };
};

export default MessageInboxHook;
