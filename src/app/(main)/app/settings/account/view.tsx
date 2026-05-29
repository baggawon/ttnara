"use client";

import Form from "@/components/1_atoms/Form";
import {
  FormBuilder,
  FormInput,
  Input,
  InputType,
} from "@/components/2_molecules/Input/FormInput";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  validateConfirmPassword,
  validateNickName,
  validatePassword,
} from "@/helpers/validate";
import { FormProvider } from "react-hook-form";
import { setTestId } from "@/helpers/common";
import WithUseWatch from "@/components/2_molecules/WithUseWatch";
import SettingsHook from "@/app/(main)/app/settings/account/hook";
import { getBoolean } from "@/helpers/basic";
import EmailValidator from "@/components/2_molecules/EmailValidator";
import { ApiOtpType } from "@/helpers/types";
import { isCuid } from "@paralleldrive/cuid2";
import FormDialog from "@/components/1_atoms/FormDialog";
import { UserCircle2, KeyRound, Mail, Loader2 } from "lucide-react";

export enum SettingsFormIds {
  password = "password",
  passwordConfirm = "passwordConfirm",
  name = "name",
  submit = "submit",
}

const SettingsView = () => {
  const {
    methods,
    trySave,
    userSettingData,
    dialogControllRef,
    createRef,
    isSubmitting,
  } = SettingsHook();
  return (
    <FormProvider {...methods}>
      <Form onSubmit={trySave}>
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <UserCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  기본 정보
                </CardTitle>
                <CardDescription>
                  아이디와 닉네임을 확인하고 관리합니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4">
                <FormInput
                  name="username"
                  label="아이디"
                  autoComplete="email"
                  disabled
                />
                <WithUseWatch name={["prevDisplayname"]}>
                  {({ prevDisplayname }: { prevDisplayname: string }) => (
                    <FormInput
                      name="displayname"
                      label="닉네임"
                      disabled={
                        !(
                          isCuid(prevDisplayname) &&
                          prevDisplayname.length === 24
                        )
                      }
                      validate={(value) =>
                        validateNickName(value, userSettingData)
                      }
                    />
                  )}
                </WithUseWatch>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <KeyRound className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  비밀번호 변경
                </CardTitle>
                <CardDescription>
                  안전을 위해 정기적으로 비밀번호를 변경해 주세요.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <FormInput
                  name="password"
                  type={InputType.password}
                  label="새 비밀번호"
                  placeholder="새 비밀번호"
                  validate={(value) => validatePassword(value, false)}
                  autoComplete="one-time-code"
                  {...setTestId(SettingsFormIds.password)}
                />
                <WithUseWatch name={["password"]}>
                  {({ password }: { password: string }) => (
                    <Input
                      name="passwordConfirm"
                      type={InputType.password}
                      placeholder="새 비밀번호 확인"
                      validate={(value) =>
                        validateConfirmPassword(value, password, false)
                      }
                      autoComplete="one-time-code"
                      {...setTestId(SettingsFormIds.passwordConfirm)}
                    />
                  )}
                </WithUseWatch>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Mail className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  이메일
                </CardTitle>
                <CardDescription>
                  알림 수신 및 본인 인증에 사용되는 이메일입니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WithUseWatch name={["changeEmail"]}>
                  {({ changeEmail }: { changeEmail: string }) => (
                    <>
                      {!getBoolean(changeEmail) && (
                        <FormInput name="email" label="이메일" disabled>
                          <Button
                            type="button"
                            className="ml-2"
                            onClick={() => {
                              methods.setValue(
                                "changeEmail",
                                !getBoolean(changeEmail)
                              );
                              methods.setValue("email", "");
                            }}
                          >
                            변경하기
                          </Button>
                        </FormInput>
                      )}

                      {getBoolean(changeEmail) && (
                        <FormBuilder name="email" label="이메일">
                          <EmailValidator
                            validate_type={ApiOtpType.EmailSettings}
                          />
                        </FormBuilder>
                      )}
                    </>
                  )}
                </WithUseWatch>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              className="w-full sm:w-auto sm:min-w-32"
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
              {...setTestId(SettingsFormIds.submit)}
            >
              {isSubmitting && (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              )}
              저장
            </Button>
          </div>
        </div>
      </Form>
      <FormDialog
        title="닉네임 설정"
        description="서비스를 계속 이용하시려면 닉네임을 설정해주세요."
        onConfirm={() => dialogControllRef.current?.cancelRef?.current?.click()}
        initialize={() => {}}
        dialogControllRef={dialogControllRef}
        formChildren={<></>}
      >
        <Button type="button" ref={createRef} className="hidden">
          알림
        </Button>
      </FormDialog>
    </FormProvider>
  );
};

export default SettingsView;
