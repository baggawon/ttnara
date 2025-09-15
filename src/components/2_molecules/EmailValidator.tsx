"use client";

import {
  FormInput,
  Input,
  InputType,
} from "@/components/2_molecules/Input/FormInput";
import { Button } from "@/components/ui/button";
import { useFormContext } from "react-hook-form";
import { ApiOtpType, ApiRoute, ValidateStatus } from "@/helpers/types";
import { postJson } from "@/helpers/common";
import { useToast } from "@/components/ui/use-toast";
import { toastData, ToastData } from "@/helpers/toastData";
import WithUseWatch from "@/components/2_molecules/WithUseWatch";
import { validateOtpNumber, validateValidEmail } from "@/helpers/validate";
import {
  type CountdownMethods,
  CountdownTimer,
} from "@/components/2_molecules/CountdownOtp";
import type { OtpProps } from "@/app/api/otp";
import { useRef } from "react";

const validateOtpInput = (value: string) => {
  if (!value) return "인증번호를 입력해주세요";
  if (!/^\d{6}$/.test(value)) return "6자리 숫자를 입력해주세요";
  return undefined;
};

const EmailValidator = ({ validate_type }: { validate_type: ApiOtpType }) => {
  const { setValue, setError, getValues } = useFormContext(); // retrieve all hook methods

  const { toast } = useToast();

  const countdownControllRef = useRef<CountdownMethods>(undefined);

  const validateOtp = async (e: any) => {
    e.preventDefault();
    const props = getValues();

    const error = validateOtpInput(props.otp);
    if (error) {
      setError("otp", { message: error });
      return;
    }
    setError("otp", { message: undefined });

    const { hasMessage, isSuccess } = await postJson<OtpProps>(ApiRoute.otp, {
      email: props.email,
      otp: props.otp,
      request_id: props.request_id,
      validate_type: ApiOtpType.EmailValid,
    });

    if (!isSuccess && hasMessage) {
      toast({ id: hasMessage, type: "error" });
      setValue("status", ValidateStatus.fail);
      setError("otp", { message: toastData[hasMessage].error.title });
      setValue("message", hasMessage as ToastData);
    } else if (isSuccess) {
      setValue("status", ValidateStatus.valid);
      setValue("message", undefined);
    }
  };

  const requestOtp = async (e: any) => {
    e.preventDefault();
    const props = getValues();

    const error = validateValidEmail(props.email, props.status);

    if (
      error &&
      !(
        props.status === ValidateStatus.progress ||
        props.message === ToastData.timeOut
      )
    ) {
      setError("email", { message: error });
      return;
    }
    setError("email", { message: undefined });
    setValue("message", undefined);
    setValue("status", ValidateStatus.progress);

    const { hasMessage, isSuccess, hasData } = await postJson<OtpProps>(
      ApiRoute.otp,
      {
        email: props.email,
        otp: props.otp,
        request_id: props.request_id,
        validate_type,
      }
    );

    if (!isSuccess && hasMessage) {
      toast({ id: hasMessage, type: "error" });
      setValue("status", ValidateStatus.fail);
      setValue("message", hasMessage as ToastData);
    } else if (isSuccess && hasData) {
      countdownControllRef.current?.setTimeLeft(1800);
      setValue("request_id", hasData);
    }
  };

  const handleTimeComplete = () => {
    setValue("status", "");
    setValue("request_id", "");
    setValue("otp", "");
    setValue("message", undefined);
  };

  return (
    <WithUseWatch name={["request_id", "status", "message"]}>
      {({
        status,
        message,
      }: {
        status: ValidateStatus | "";
        message?: ToastData;
      }) => (
        <>
          <FormInput
            name="email"
            validate={(value) => validateValidEmail(value, status)}
            type={InputType.email}
            placeholder="이메일"
            formClassName="[&>div]:gap-4 flex-col"
            disabled={
              status !== "" &&
              [ValidateStatus.progress, ValidateStatus.valid].includes(status)
            }
            autoComplete="email"
          >
            {(status === "" || message === ToastData.alreadySend) && (
              <Button type="button" onClick={requestOtp}>
                인증번호발송
              </Button>
            )}
            {(status === ValidateStatus.progress ||
              message === ToastData.timeOut) && (
              <Button type="button" onClick={requestOtp}>
                재발송
              </Button>
            )}
            {status === ValidateStatus.valid && (
              <Button type="button" disabled>
                인증완료
              </Button>
            )}
          </FormInput>
          {status === ValidateStatus.progress && (
            <div>
              <Input
                name="otp"
                validate={(value) => validateOtpNumber(value, message)}
                type={InputType.text}
                inputMode="numeric"
                placeholder="인증번호"
                className="gap-4 relative tracking-wider"
                autoComplete="one-time-code"
                maxLength={6}
                isInnerMessage={false}
              >
                <CountdownTimer
                  className="absolute top-1/2 -translate-y-1/2 right-[5.5rem]"
                  onComplete={handleTimeComplete}
                  countdownControllRef={countdownControllRef}
                />
                <Button type="button" onClick={validateOtp}>
                  인증
                </Button>
              </Input>
            </div>
          )}
        </>
      )}
    </WithUseWatch>
  );
};

export default EmailValidator;
