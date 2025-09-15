"use client";
import useEffectFunctionHook from "@/helpers/customHook/useEffectFunction";
import { useAdminModeStore } from "@/helpers/state";

const ControllAdminMode = ({ state }: { state: boolean }) => {
  const { SetOff, SetOn } = useAdminModeStore((state) => state);

  useEffectFunctionHook({
    Function: () => {
      if (state) SetOn();
      else SetOff();
    },
    dependency: [state],
  });
  return <></>;
};

export default ControllAdminMode;
