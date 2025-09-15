import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postJson } from "@/helpers/common";
import { ApiRoute, QueryKey } from "@/helpers/types";
import { useToast } from "@/components/ui/use-toast";
import { ToastData } from "@/helpers/toastData";
import { useSession } from "next-auth/react";

export function useRankEvaluation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: session } = useSession();

  const mutation = useMutation({
    mutationFn: async () => {
      // Don't proceed if not authenticated
      if (!session?.user?.name) {
        return null; // Return null instead of throwing an error
      }

      const response = await postJson(ApiRoute.ranksEvaluate);
      if (!response.isSuccess) {
        throw new Error(response.hasMessage);
      }
      return response;
    },
    onSuccess: (data) => {
      // Only invalidate queries if data is not null (user is authenticated)
      if (data) {
        queryClient.invalidateQueries({ queryKey: [QueryKey.account] });
      }
    },
    onError: (error) => {
      // Only show toast for non-authentication errors
      // We can determine this by checking if the error is related to authentication
      const isAuthError = !session?.user?.name;

      if (!isAuthError) {
        toast({
          id: ToastData.unknown,
          type: "error",
        });
      }
    },
  });

  return mutation;
}
