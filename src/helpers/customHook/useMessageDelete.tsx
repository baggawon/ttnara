import { ApiRoute, MessageType } from "@/helpers/types";
import { postJson } from "@/helpers/common";
import type { messageDeleteProps } from "@/app/api/message/delete";
import { useToast } from "@/components/ui/use-toast";
import { deleteMessageCache } from "@/helpers/optimistic";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import useEffectFunctionHook from "@/helpers/customHook/useEffectFunction";
import { EasyDialog } from "@/components/1_atoms/EasyModal";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

const useMessageDelete = (props?: { onSuccess?: any }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const targetId = useRef<string>("");
  const targetMessageType = useRef<MessageType>(MessageType.inbox);

  const deleteMutation = useMutation({
    mutationFn: async ({
      id,
      messageType,
    }: {
      id: string;
      messageType: MessageType;
    }) => {
      const { restore } = deleteMessageCache(id, messageType, queryClient);
      const { hasMessage, isSuccess } = await postJson<messageDeleteProps>(
        ApiRoute.messageDelete,
        { id, messageType },
        restore
      );
      if (hasMessage) {
        toast({ id: hasMessage, type: isSuccess ? "success" : "error" });
      }
      if (isSuccess) {
        props?.onSuccess && props.onSuccess();
      }
      setOpen(false);
    },
  });

  const tryDelete = (id: string, messageType: MessageType) => {
    if (targetId.current !== id) {
      targetId.current = id;
      targetMessageType.current = messageType;
      setOpen(true);
      return;
    }
    if (deleteMutation.isPending) return;
    deleteMutation.mutate({ id, messageType });
  };

  const [open, setOpen] = useState(false);

  useEffectFunctionHook({
    Function: () => {
      if (!open) {
        targetId.current = "";
      }
    },
    dependency: [open],
  });

  const isDeleting = deleteMutation.isPending;

  const DeleteConfirmModal = (
    <EasyDialog
      button={<Button type="button" className="hidden" />}
      title="메시지 삭제 확인"
      open={open}
      setOpen={setOpen}
    >
      <div className="w-full flex flex-col [&>p]:text-left [&>p]:text-gray-500">
        <p>
          한번 삭제한 자료는 복구할 방법이 없습니다.
          <br />
          <br />
          정말 삭제하시겠습니까?
        </p>
        <div className="w-full text-center mt-4 flex justify-center gap-4">
          <Button
            variant="outline"
            type="button"
            className="w-[104px]"
            disabled={isDeleting}
            onClick={() => setOpen(false)}
          >
            취소
          </Button>
          <Button
            type="button"
            className="w-[104px]"
            disabled={isDeleting}
            aria-busy={isDeleting}
            onClick={() =>
              tryDelete(targetId.current, targetMessageType.current)
            }
          >
            {isDeleting && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
            확인
          </Button>
        </div>
      </div>
    </EasyDialog>
  );

  return { tryDelete, DeleteConfirmModal };
};

export default useMessageDelete;
