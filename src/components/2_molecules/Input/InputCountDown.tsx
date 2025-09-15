import { useRef, useState, type FC, type LegacyRef } from "react";
import { useFormContext, type UseFormReturn, useWatch } from "react-hook-form";
import Countdown from "react-countdown";
import clsx from "clsx";
import useEffectFunctionHook from "@/helpers/customHook/useEffectFunction";

interface registerReturnProps {
  setValue: UseFormReturn["setValue"];
  control: UseFormReturn["control"];
}

export const InputCountDown: FC = () => {
  const { setValue, control }: registerReturnProps = useFormContext(); // retrieve all hook methods
  const isValidate = useWatch({
    control,
    name: "isValidate",
  });
  const CountdownRef: LegacyRef<Countdown> = useRef(null);
  const [time, setTime] = useState(Date.now() + 180 * 1000);

  const [isShow, setIsShow] = useState(false);

  useEffectFunctionHook({
    Function: () => {
      if (isValidate === "valid") {
        CountdownRef.current?.stop();
      }
      if (["time_out", "otp_error"].includes(isValidate)) {
        CountdownRef.current?.stop();
        return setIsShow(true);
      }
      if (isValidate === "") {
        setTime(Date.now() + 180 * 1000);
        CountdownRef.current?.start();
      }
      setIsShow(false);
    },
    dependency: [isValidate, CountdownRef.current],
  });

  const convertSeconds = (seconds: string) =>
    Number(seconds) < 10 ? `0${seconds}` : seconds;

  return (
    <Countdown
      date={time}
      intervalDelay={1000}
      precision={1}
      onComplete={() => {
        if (isValidate !== "time_out") setValue("isValidate", "time_out");
      }}
      ref={CountdownRef}
      renderer={(props: any) => (
        <h6
          className={clsx(
            "absolute right-4 top-1/2 -translate-y-1/2",
            isValidate === "time_out" ? "text-[#8f8f8f]" : "text-[#ee3239]"
          )}
        >
          {!isShow
            ? `${props.minutes}:${convertSeconds(props.seconds)}`
            : "0:00"}
        </h6>
      )}
    />
  );
};
