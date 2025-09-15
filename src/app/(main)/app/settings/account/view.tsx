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
  CardFooter,
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

export enum SettingsFormIds {
  password = "password",
  passwordConfirm = "passwordConfirm",
  name = "name",
  submit = "submit",
}

const SettingsView = () => {
  const { methods, trySave, userSettingData, dialogControllRef, createRef } =
    SettingsHook();
  return (
    <FormProvider {...methods}>
      <Form onSubmit={trySave}>
        <div className="grid grid-cols-1 gap-4">
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
                  !(isCuid(prevDisplayname) && prevDisplayname.length === 24)
                }
                validate={(value) => validateNickName(value, userSettingData)}
              />
            )}
          </WithUseWatch>
          <div className="flex flex-col gap-4">
            <FormInput
              name="password"
              type={InputType.password}
              label="비밀번호"
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
          </div>
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
                    <EmailValidator validate_type={ApiOtpType.EmailSettings} />
                  </FormBuilder>
                )}
              </>
            )}
          </WithUseWatch>
          <Button
            className="w-full md:w-fit"
            type="submit"
            {...setTestId(SettingsFormIds.submit)}
          >
            저장
          </Button>
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
