import { useForm } from "react-hook-form";
import { useToast } from "@/components/ui/use-toast";
import { ApiRoute, AppRoute, QueryKey } from "@/helpers/types";
import { postJson } from "@/helpers/common";
import type { MessageCreatePostProps } from "@/app/api/message/create";
import { useRouter, useSearchParams } from "next/navigation";
import useEffectFunctionHook from "@/helpers/customHook/useEffectFunction";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export interface MessagePostInitialValues {
  to_uid: string;
  contents: string;
}

const MessagePostHook = () => {
  const initialValues: () => MessagePostInitialValues = () => ({
    to_uid: "",
    contents: "",
  });

  const searchParams = useSearchParams();

  useEffectFunctionHook({
    Function: () => {
      if (searchParams.has("to_uid")) {
        methods.setValue("to_uid", searchParams.get("to_uid")!);
      }
    },
    dependency: [searchParams],
  });

  const methods = useForm({
    defaultValues: initialValues(),
    reValidateMode: "onSubmit",
  });

  const router = useRouter();

  const { toast } = useToast();

  const queryClient = useQueryClient();

  const sendMutation = useMutation({
    mutationFn: async (props: MessagePostInitialValues) => {
      const { hasMessage, isSuccess } = await postJson<MessageCreatePostProps>(
        ApiRoute.messageCreate,
        props
      );
      if (hasMessage) {
        toast({ id: hasMessage, type: isSuccess ? "success" : "error" });
      }
      if (isSuccess) {
        queryClient.refetchQueries({ queryKey: [QueryKey.message] });
        router.push(AppRoute.MessageHistory);
      }
    },
    onError: (error) => {
      console.log("error", error);
    },
  });

  const trySend = (props: MessagePostInitialValues) => {
    if (sendMutation.isPending) return;
    sendMutation.mutate(props);
  };

  return {
    methods,
    trySend,
    isSubmitting: sendMutation.isPending,
  };
};

export default MessagePostHook;
