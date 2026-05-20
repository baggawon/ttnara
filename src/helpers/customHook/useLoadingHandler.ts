import { useQueryClient } from "@tanstack/react-query";
import { useLoadingStore } from "@/helpers/state";

// Reading actions via getState() avoids subscribing to the loading store.
// Subscribing to `(s) => s` (as the previous version did) re-rendered every
// caller whenever ANY query in the app flipped state, since useGetQuery
// increments/decrements the global loading counter on every status change.
const useLoadingHandler = () => {
  const { setLoading, disableLoading } = useLoadingStore.getState();
  const queryClient = useQueryClient();
  return { setLoading, disableLoading, queryClient };
};

export default useLoadingHandler;
