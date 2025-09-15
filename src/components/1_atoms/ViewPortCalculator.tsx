"use client";

import useEffectFunctionHook from "@/helpers/customHook/useEffectFunction";

export default function ViewPortCalculator() {
  const setScreenHeight = () => {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", `${vh}px`);
  };
  useEffectFunctionHook({
    Function: () => {
      setScreenHeight();
      window.addEventListener("resize", setScreenHeight);
    },
    Unmount: () => window.removeEventListener("resize", setScreenHeight, true),
    dependency: [],
  });
  return <></>;
}
