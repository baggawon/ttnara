"use client";

import { Input, InputType } from "@/components/2_molecules/Input/FormInput";
import { Button } from "@/components/ui/button";
import { FormProvider, useForm } from "react-hook-form";
import Form from "@/components/1_atoms/Form";
import useIndexedDB from "@/helpers/customHook/useIndexedDB";
import useEffectFunctionHook from "@/helpers/customHook/useEffectFunction";
import {
  ApiRoute,
  AppRoute,
  BroadcastChannels,
  BroadcastEvents,
} from "@/helpers/types";
import { postJson, refreshCache, setTestId } from "@/helpers/common";
import useLoadingHandler from "@/helpers/customHook/useLoadingHandler";
import { useToast } from "@/components/ui/use-toast";
import { removeColumnsFromObject } from "@/helpers/basic";
import type { LoginProps } from "@/app/api/login";
import { CustomCheckbox } from "@/components/2_molecules/Input/CheckboxInput";
import { useLoadingStore } from "@/helpers/state";
import { signIn } from "next-auth/react";
import { ToastData } from "@/helpers/toastData";
import { useRouter } from "next/navigation";
import AccountNavigationWidget from "@/components/1_atoms/AccountNavigationWidget";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Logo from "@/components/1_atoms/Logo";
import { GoogleOauth } from "@/components/1_atoms/GoogleOauth";
import useLoading from "@/helpers/customHook/useLoading";
import { useState } from "react";

export interface LoginInitialValues {
  username: string;
  password: string;
  remember: boolean;
}

export enum LoginFormIds {
  username = "username",
  password = "password",
  remember = "remember",
  submit = "submit",
}

const LoginForm = () => {
  const { setLoading, disableLoading, queryClient } = useLoadingHandler();
  const { loading } = useLoading();

  const initialValues = (): LoginInitialValues => ({
    username: "",
    password: "",
    remember: false,
  });

  const methods = useForm({
    defaultValues: initialValues(),
    reValidateMode: "onSubmit",
  });

  const { loadDb, saveData, getData, clearData } = useIndexedDB();

  const [first, setFirst] = useState(true);

  useEffectFunctionHook({
    Function: async () => {
      useLoadingStore.getState().clearLoading();

      const parsedHash = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = parsedHash.get("access_token");
      if (accessToken) {
        await tryGoogleLogin(accessToken);
        return;
      }
      await navigator.storage?.persist?.();
      await loadDb();

      const data = await getData();
      const needLocalSave = data?.remember === "true" && data?.username;

      if (needLocalSave) {
        methods.setValue("remember", true);
        methods.setValue("username", data.username);
      }
      setFirst(false);
    },
    dependency: [],
  });

  const { toast } = useToast();

  const router = useRouter();

  const tryGoogleLogin = async (accessToken: string) => {
    if (loading) return;
    setLoading();
    try {
      const result = await signIn("google-token", {
        token: accessToken,
        redirect: false,
      });
      const loginSuccess = !result?.error;

      if (loginSuccess) {
        refreshCache(queryClient);

        const channel = new BroadcastChannel(BroadcastChannels.Auth);
        channel.postMessage(BroadcastEvents.SignIn);
        toast({ id: ToastData.oauth, type: "success" });
        router.push(AppRoute.Main);
      } else if (result?.error === "AccessDenied") {
        toast({ id: ToastData.accessDenied, type: "error" });
      } else {
        toast({ id: ToastData.oauth, type: "error" });
        router.push(AppRoute.Login);
      }
    } catch (error) {
      disableLoading();
      console.log("error", error);
    }
    disableLoading();
  };

  const tryLogin = async (props: LoginInitialValues) => {
    if (loading) return;
    setLoading();
    try {
      const { isSuccess, hasMessage } = await postJson<LoginProps>(
        ApiRoute.login,
        removeColumnsFromObject(props, ["remember"])
      );
      disableLoading();
      if (isSuccess) {
        const result = await signIn("credentials", {
          ...props,
          redirect: false,
        });
        const loginSuccess = !result?.error;

        if (loginSuccess) {
          refreshCache(queryClient);

          if (props.remember)
            await saveData({
              remember: "true",
              username: props.username,
            });
          const channel = new BroadcastChannel(BroadcastChannels.Auth);
          channel.postMessage(BroadcastEvents.SignIn);
          toast({ id: ToastData.login, type: "success" });
          router.push(AppRoute.Main);
        } else if (result?.error === "AccessDenied") {
          toast({ id: ToastData.accessDenied, type: "error" });
        } else {
          toast({ id: ToastData.login, type: "error" });
        }
      } else if (!isSuccess && hasMessage) {
        toast({ id: hasMessage, type: "error" });
      }
    } catch (error) {
      disableLoading();
      console.log("error", error);
    }
  };

  const saveRemember = async (_event: React.ChangeEvent<HTMLInputElement>) => {
    const currentData = methods.getValues("remember");
    methods.setValue("remember", !currentData);

    if (!currentData === false) {
      await clearData();
    } else {
      await saveData({
        remember: JSON.stringify(!currentData),
        username: methods.getValues("username"),
      });
    }
  };

  const googleOauth = () => {
    const [protocol, domain] = window.location.href.split("//");
    const redirectURI = `${protocol}//${domain.split("/")[0]}/login`;
    window.location.href = `https://accounts.google.com/o/oauth2/auth?client_id=${(window as any).CLIENT_GOOGLE_CLIENT_ID}&redirect_uri=${redirectURI}&response_type=token&scope=https://www.googleapis.com/auth/userinfo.email`;
  };

  return !first ? (
    <Card className="mt-6 w-full sm:w-96">
      <CardHeader className="gap-4">
        <Logo href={AppRoute.Main} size="large" />
        <CardTitle className="mt-4 text-2xl">로그인</CardTitle>
      </CardHeader>
      <FormProvider {...methods}>
        <Form onSubmit={tryLogin} className="flex gap-4 w-full">
          <CardContent className="flex flex-col gap-4 w-full">
            <div className="flex flex-col gap-4 w-full">
              <Input name="username" placeholder="회원 아이디를 입력하세요." />
              <Input
                name="password"
                type={InputType.password}
                placeholder="비밀번호를 입력하세요."
              />
              <CustomCheckbox
                name="remember"
                label="아이디 기억"
                onClick={saveRemember}
                {...setTestId(LoginFormIds.remember)}
              />
            </div>
            <Button type="submit" className="w-fit mx-auto">
              로그인
            </Button>
            <div className="relative w-full border-t pt-6 mt-2 flex justify-center">
              <p className="absolute -top-[6px] left-1/2 -translate-x-1/2 bg-card px-4">
                간편 로그인
              </p>
              <GoogleOauth onClick={googleOauth} />
            </div>
            <AccountNavigationWidget />
          </CardContent>
        </Form>
      </FormProvider>
    </Card>
  ) : (
    <></>
  );
};

export default LoginForm;
