import { useLoadingStore } from "@/helpers/state";

const useLoading = () => {
  const loading = useLoadingStore((state) => state.loading);

  return { loading: loading > 0 };
};

export default useLoading;
