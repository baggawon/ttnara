import clsx from "clsx";
import useEffectFunctionHook from "@/helpers/customHook/useEffectFunction";
import React, {
  useState,
  useRef,
  type RefObject,
  useImperativeHandle,
} from "react";

export interface CountdownMethods {
  setTimeLeft: (value: number) => void;
}
export const CountdownTimer = ({
  onComplete,
  className,
  countdownControllRef,
}: {
  onComplete: () => void;
  className?: string;
  countdownControllRef: RefObject<CountdownMethods | undefined>;
}) => {
  useImperativeHandle(countdownControllRef, () => ({
    setTimeLeft,
  }));
  const [timeLeft, setTimeLeft] = useState(1800); // 30분 = 1800초
  const [isActive, setIsActive] = useState(true);

  const interval = useRef<NodeJS.Timeout | null>(null);
  useEffectFunctionHook({
    Function: () => {
      if (isActive && timeLeft > 0) {
        interval.current = setInterval(() => {
          setTimeLeft((time) => time - 1);
        }, 1000);
      } else if (timeLeft === 0) {
        setIsActive(false);
        if (onComplete) {
          onComplete();
        }
      }
    },
    Unmount: () => interval.current && clearInterval(interval.current),
    dependency: [isActive, timeLeft, onComplete],
  });

  // 분과 초로 변환
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className={clsx("text-center", className)}>
      <div className="text-xl font-bold">
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </div>
      {!isActive && (
        <div className="text-red-500 mt-2">인증 시간이 만료되었습니다</div>
      )}
    </div>
  );
};
