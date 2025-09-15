"use client";

import useEffectFunctionHook from "@/helpers/customHook/useEffectFunction";
import { useImperativeHandle, useRef, useState } from "react";

export const TimeCounter = ({
  initTime,
  timeRef,
  onEnd,
  className,
}: {
  initTime: number;
  timeRef: any;
  onEnd: () => void;
  className?: string;
}) => {
  useImperativeHandle(timeRef, () => ({
    count,
    setCount: (time: number) => {
      setCount(time);
      if (timer.current) clearInterval(timer.current);
      timer.current = setTimer();
    },
  }));
  const [count, setCount] = useState(initTime);
  const setTimer = () =>
    setInterval(() => {
      setCount((prev) => {
        if (prev === 0) {
          clearInterval(timer.current);
          onEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  const timer = useRef<NodeJS.Timeout>(setTimer());

  useEffectFunctionHook({
    Function: () => {
      timer.current = setTimer();
    },
    Unmount: () => clearInterval(timer.current),
    dependency: [],
  });

  const countConverter = (count: number) => {
    const minute = Math.floor(count / 60);
    const second = count % 60;
    return `${minute < 10 ? `0${minute}` : minute}:${
      second < 10 ? `0${second}` : second
    }`;
  };
  return <div className={className}>{countConverter(count)}</div>;
};
