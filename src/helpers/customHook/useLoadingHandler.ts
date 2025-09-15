import { useQueryClient } from "@tanstack/react-query";
import { useLoadingStore } from "@/helpers/state";

const useLoadingHandler = () => {
  const { setLoading, disableLoading } = useLoadingStore((state) => state);
  const queryClient = useQueryClient();
  return { setLoading, disableLoading, queryClient };
};

export default useLoadingHandler;
