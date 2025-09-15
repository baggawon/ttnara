"use client";

import FormDialog, {
  type FormDialogMethods,
} from "@/components/1_atoms/FormDialog";
import { FormBuilder } from "@/components/2_molecules/Input/FormInput";
import { OtpInput } from "@/components/2_molecules/Input/OtpInput";
import { Button } from "@/components/ui/button";
import { InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/components/ui/use-toast";
import {
  ApiRoute,
  AppRoute,
  TetherMethods,
  TetherStatus,
} from "@/helpers/types";
import { type RefObject, useRef } from "react";
import useLoadingHandler from "@/helpers/customHook//useLoadingHandler";
import type { TetherPublicWithProfile } from "@/app/api/tethers/read";
import type { UseFormReturn } from "react-hook-form";
import { get } from "@/helpers/common";
import { useRouter } from "next/navigation";
import type { Session } from "next-auth";
import { ToastData } from "@/helpers/toastData";

export const useTetherGoDetail = (session: Session | null | undefined) => {
  const canWrite = session?.user !== null && session?.user !== undefined;

  const router = useRouter();

  const { toast } = useToast();

  const { setLoading, disableLoading } = useLoadingHandler();

  const passwordModalRef = useRef<HTMLButtonElement | null>(null);
  const passwordModalCache = useRef<TetherPublicWithProfile | undefined>(
    undefined
  );
  const passwordConfirm = async (
    props: { password: string },
    cancelRef: RefObject<HTMLButtonElement | null>,
    methods: UseFormReturn<any, any, undefined>
  ) => {
    if (!passwordModalCache.current) return;
    const tether = passwordModalCache.current;
    setLoading();
    try {
      const { hasData } = await get(ApiRoute.tethersRead, {
        query: {
          id: tether.id,
          password: props.password,
        },
      });
      if (hasData?.tethers.length > 0) {
        router.push(
          `${AppRoute.Threads}/tether/${tether.id}?password=${props.password}`
        );
        methods.reset({
          password: "",
        });
        cancelRef.current?.click();
      } else {
        toast({
          id: ToastData.notMatchPassword,
          type: "error",
        });
      }
    } catch (error) {
      toast({
        id: ToastData.unknown,
        type: "error",
      });
    }
    disableLoading();
  };

  const dialogControllRef = useRef<FormDialogMethods | undefined>(undefined);
  const goDetail = async (tether: TetherPublicWithProfile) => {
    if (!canWrite) {
      toast({
        id: ToastData.tetherNeedLogin,
        type: "error",
      });
      return;
    }

    const owner =
      canWrite &&
      session?.user?.displayname === tether.user?.profile?.displayname;

    // 게시자는 상세페이지 바로 이동
    if (owner) {
      router.push(`${AppRoute.Threads}/tether/${tether.id}`);
      return;
    }

    // 비밀번호 설정되어 있는경우
    if (
      tether.methods === TetherMethods.Promise &&
      tether.status === TetherStatus.Open
    ) {
      dialogControllRef.current?.methods.reset({
        password: "",
      });
      passwordModalCache.current = tether;
      passwordModalRef.current?.click();
      return;
    }

    if (tether.status === TetherStatus.Open) {
      if (tether.use_author && session.user.kyc_id === null) {
        toast({
          id: ToastData.tetherNeedKYC,
          type: "error",
        });
        return;
      }
      router.push(`${AppRoute.Threads}/tether/${tether.id}`);
      return;
    } else if (
      [TetherStatus.Complete, TetherStatus.Progress].includes(
        tether.status as TetherStatus
      )
    ) {
      const { hasData } = await get(ApiRoute.tethersRead, {
        query: {
          id: tether.id,
        },
      });

      if (hasData?.tethers.length > 0) {
        router.push(`${AppRoute.Threads}/tether/${tether.id}`);
        return;
      }
      toast({
        id:
          tether.status === TetherStatus.Complete
            ? ToastData.tetherAlreadyComplete
            : ToastData.tetherProgress,
        type: "error",
      });
      return;
    }
  };

  const passwordModal = (
    <FormDialog
      title="비밀번호 확인"
      description=""
      onConfirm={passwordConfirm}
      initialize={() => ({ password: "" })}
      dialogControllRef={dialogControllRef}
      formChildren={
        <>
          <FormBuilder
            name="password"
            label="거래 비밀번호"
            formClassName="!flex flex-col items-center"
          >
            <OtpInput name="password" maxLength={4}>
              <InputOTPGroup className="[&>div:first-child]:rounded-l-[10px] [&>div:last-child]:rounded-r-[10px]">
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
              </InputOTPGroup>
            </OtpInput>
          </FormBuilder>
        </>
      }
    >
      <Button type="button" className="hidden" ref={passwordModalRef}>
        패스워드 입력폼
      </Button>
    </FormDialog>
  );

  return { goDetail, passwordModal };
};
