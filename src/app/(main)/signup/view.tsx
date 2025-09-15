"use client";

import { FormProvider } from "react-hook-form";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormInput, InputType } from "@/components/2_molecules/Input/FormInput";
import { ApiOtpType, AppRoute } from "@/helpers/types";
import Form from "@/components/1_atoms/Form";
import { setTestId } from "@/helpers/common";
import {
  validateConfirmPassword,
  validateNickName,
  validatePassword,
  validateUserName,
} from "@/helpers/validate";
import WithUseWatch from "@/components/2_molecules/WithUseWatch";
import SignupHook from "@/app/(main)/signup/hook";
import EmailValidator from "@/components/2_molecules/EmailValidator";

export const enum SignupFormIds {
  Userid = "username",
  Password = "password",
  PasswordConfirm = "passwordConfirm",
  Nickname = "displayname",
  Email = "Email",
  MainRouter = "mainRouter",
  Otp = "otp",
  Submit = "submit",
}

const SignupView = () => {
  const { methods, trySignup, router, userSettingData } = SignupHook();
  return (
    <FormProvider {...methods}>
      <Form onSubmit={trySignup}>
        <CardContent className="flex flex-col gap-4">
          <FormInput
            name="username"
            validate={validateUserName}
            placeholder="아이디"
            autoComplete="name"
            {...setTestId(SignupFormIds.Userid)}
          />
          <FormInput
            name="password"
            type={InputType.password}
            placeholder="비밀번호"
            validate={validatePassword}
            autoComplete="current-password"
            {...setTestId(SignupFormIds.Password)}
          />
          <WithUseWatch name={["password"]}>
            {({ password }: { password: string }) => (
              <FormInput
                name="passwordConfirm"
                type={InputType.password}
                placeholder="비밀번호 확인"
                validate={(value) => validateConfirmPassword(value, password)}
                autoComplete="current-password"
                {...setTestId(SignupFormIds.PasswordConfirm)}
              />
            )}
          </WithUseWatch>
          <FormInput
            name="displayname"
            validate={(value) => validateNickName(value, userSettingData)}
            placeholder="닉네임"
            autoComplete="displayname"
            {...setTestId(SignupFormIds.Nickname)}
          />
          <EmailValidator validate_type={ApiOtpType.EmailSignup} />
          {/* <WithUseWatch name={["request_id", "status", "message"]}>
            {({ status, message }: SignupInitialValues) => (
              <>
                <FormInput
                  name="phone_number"
                  validate={validatePhoneNumber}
                  type={InputType.tel}
                  placeholder="전화번호"
                  {...setTestId(SignupFormIds.PhoneNumber)}
                  formClassName="[&>div]:gap-4"
                  disabled={
                    status !== "" &&
                    [ValidateStatus.progress, ValidateStatus.valid].includes(
                      status
                    )
                  }
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
                  <div className="flex gap-4 items-center">
                    <Input
                      name="otp"
                      validate={(value) => validateOtpNumber(value, message)}
                      type={InputType.text}
                      inputMode="numeric"
                      placeholder="인증번호"
                      className="gap-4 relative tracking-wider"
                      autoComplete="one-time-code"
                      maxLength={6}
                      {...setTestId(SignupFormIds.Otp)}
                    >
                      <CountdownTimer
                        className="absolute top-1/2 -translate-y-1/2 right-4"
                        onComplete={handleTimeComplete}
                      />
                    </Input>
                    <Button type="button" onClick={validateOtp}>
                      인증
                    </Button>
                  </div>
                )}
              </>
            )}
          </WithUseWatch> */}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <div className="flex justify-center">
            <Button type="submit" {...setTestId(SignupFormIds.Submit)}>
              가입
            </Button>
          </div>

          <div className="flex justify-between">
            <Button
              type="button"
              variant="ghost"
              {...setTestId(SignupFormIds.MainRouter)}
              onClick={() => router.push(AppRoute.Main)}
            >
              이전으로
            </Button>
          </div>
        </CardFooter>
      </Form>
    </FormProvider>
  );
};

export default SignupView;
