"use client";

import { useEffect, useRef } from "react";

const useEffectFunctionHook = ({
  Function,
  Unmount,
  dependency,
}: {
  Function?: () => void;
  Unmount?: () => void;
  dependency?: any[];
}) => {
  const isComponentMounted = useRef(false);
  useEffect(() => {
    isComponentMounted.current = true;
    try {
      if (isComponentMounted.current) {
        if (typeof Function === "function") Function();
      }
    } catch (error2) {
      isComponentMounted.current = false;
    }
    return () => {
      if (typeof Unmount === "function") Unmount();
      isComponentMounted.current = false;
    };
    // eslint-disable-next-line
  }, dependency ?? []);
};

export default useEffectFunctionHook;
