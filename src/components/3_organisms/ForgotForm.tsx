"use client";

import { Button } from "@/components/ui/button";
import { FormProvider, useForm } from "react-hook-form";
import Form from "@/components/1_atoms/Form";
import {
  ApiOtpType,
  ApiRoute,
  AppRoute,
  ForgotTypes,
  type ValidateStatus,
} from "@/helpers/types";
import { postJson } from "@/helpers/common";
import useLoadingHandler from "@/helpers/customHook/useLoadingHandler";
import { useToast } from "@/components/ui/use-toast";
import { map, removeColumnsFromObject } from "@/helpers/basic";
import type { ToastData } from "@/helpers/toastData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Logo from "@/components/1_atoms/Logo";
import EmailValidator from "@/components/2_molecules/EmailValidator";
import ForgotNavigationWidget from "@/components/1_atoms/ForgotNavigationWidget";
import WithUseWatch from "@/components/2_molecules/WithUseWatch";
import {
  ToggleGroupInput,
  ToggleGroupItem,
} from "@/components/2_molecules/Input/ToggleGroupInput";
import clsx from "clsx";
import type { ForgotProps } from "@/app/api/forgot";
import { FormInput, InputType } from "@/components/2_molecules/Input/FormInput";
import { validateConfirmPassword, validatePassword } from "@/helpers/validate";
import { useRef } from "react";
import FormDialog, {
  type FormDialogMethods,
} from "@/components/1_atoms/FormDialog";

export interface ForgotInitialValues {
  forgotType: ForgotTypes;
  email: string;
  status: ValidateStatus | "";
  otp: string;
  message?: ToastData;
  request_id?: string;
  password: string;
  passwordConfirm: string;
}

const ForgotForm = () => {
  const { setLoading, disableLoading, queryClient } = useLoadingHandler();

  const initialValues = (): ForgotInitialValues => ({
    forgotType: ForgotTypes.Id,
    email: "",
    status: "",
    otp: "",
    password: "",
    passwordConfirm: "",
  });

  const methods = useForm({
    defaultValues: initialValues(),
    reValidateMode: "onSubmit",
  });

  const { toast } = useToast();

  const dialogControllRef = useRef<FormDialogMethods>(undefined);
  const createRef = useRef<HTMLButtonElement | null>(null);

  const tryForgot = async (props: ForgotInitialValues) => {
    setLoading();
    try {
      const { isSuccess, hasMessage, hasData } = await postJson<ForgotProps>(
        ApiRoute.forgot,
        removeColumnsFromObject(props, ["status", "otp", "message"])
      );
      disableLoading();
      if (isSuccess) {
        if (props.forgotType === ForgotTypes.Id && hasData) {
          dialogControllRef.current?.methods.setValue("username", hasData);
          createRef.current?.click();
        }
        if (props.forgotType === ForgotTypes.Password && hasMessage) {
          toast({ id: hasMessage, type: "success" });
        }
        methods.reset(initialValues());
      } else if (!isSuccess && hasMessage) {
        toast({ id: hasMessage, type: "error" });
      }
    } catch (error) {
      disableLoading();
      console.log("error", error);
    }
  };

  return (
    <Card className="mt-6 w-full sm:w-96">
      <CardHeader className="gap-4">
        <Logo href={AppRoute.Main} size="large" />
        <CardTitle className="mt-4 text-2xl">이이디, 비밀번호 찾기</CardTitle>
      </CardHeader>
      <FormProvider {...methods}>
        <Form onSubmit={tryForgot} className="flex gap-4 w-full">
          <CardContent className="flex flex-col gap-4 w-full">
            <div className="flex flex-col gap-4 w-full">
              <WithUseWatch name={["forgotType"]}>
                {({ forgotType }: ForgotInitialValues) => (
                  <ToggleGroupInput
                    name="forgotType"
                    variant="outline"
                    orientation="horizontal"
                    className="justify-start mt-4"
                  >
                    {map(
                      [
                        {
                          name: "아이디",
                          value: ForgotTypes.Id,
                        },
                        {
                          name: "비밀번호",
                          value: ForgotTypes.Password,
                        },
                      ],
                      (trade_type) => (
                        <ToggleGroupItem
                          key={`${trade_type.name}*&*${trade_type.value}`}
                          value={trade_type.value}
                          aria-label={trade_type.name}
                          className={clsx(
                            forgotType === trade_type.value && "bg-accent"
                          )}
                        >
                          {trade_type.name}
                        </ToggleGroupItem>
                      )
                    )}
                  </ToggleGroupInput>
                )}
              </WithUseWatch>
              <EmailValidator validate_type={ApiOtpType.EmailForgotPassword} />

              <WithUseWatch name={["forgotType"]}>
                {({ forgotType }: ForgotInitialValues) => (
                  <>
                    {forgotType === ForgotTypes.Password && (
                      <>
                        <FormInput
                          name="password"
                          type={InputType.password}
                          placeholder="새 비밀번호"
                          validate={validatePassword}
                          autoComplete="current-password"
                        />
                        <WithUseWatch name={["password"]}>
                          {({ password }: { password: string }) => (
                            <FormInput
                              name="passwordConfirm"
                              type={InputType.password}
                              placeholder="새 비밀번호 확인"
                              validate={(value) =>
                                validateConfirmPassword(value, password)
                              }
                              autoComplete="current-password"
                            />
                          )}
                        </WithUseWatch>
                      </>
                    )}
                  </>
                )}
              </WithUseWatch>
            </div>
            <WithUseWatch name={["forgotType"]}>
              {({ forgotType }: ForgotInitialValues) => (
                <Button type="submit" className="w-fit mx-auto">
                  {forgotType === ForgotTypes.Id ? "찾기" : "변경하기"}
                </Button>
              )}
            </WithUseWatch>
            <ForgotNavigationWidget />
          </CardContent>
        </Form>
      </FormProvider>

      <FormDialog
        title="아이디 찾기"
        description="아이디 찾기 결과는 다음과 같습니다."
        onConfirm={() => {}}
        initialize={() => ({ username: "" })}
        dialogControllRef={dialogControllRef}
        formChildren={
          <>
            <FormInput name="username" label="아이디" />
          </>
        }
      >
        <Button type="button" className="hidden" ref={createRef}>
          추가
        </Button>
      </FormDialog>
    </Card>
  );
};

export default ForgotForm;
