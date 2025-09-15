"use client";

import {
  FormBuilder,
  FormInput,
} from "@/components/2_molecules/Input/FormInput";
import { FormProvider, useForm } from "react-hook-form";
import { get, postJson, refreshCache } from "@/helpers/common";
import useEffectFunctionHook from "@/helpers/customHook/useEffectFunction";
import {
  ApiRoute,
  AppRoute,
  QueryKey,
  type UserAndSettings,
} from "@/helpers/types";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import { userGet } from "@/helpers/get";
import clsx from "clsx";
import WithUseWatch from "@/components/2_molecules/WithUseWatch";
import { ShieldUser } from "lucide-react";
import { Button } from "@/components/ui/button";
import Form from "@/components/1_atoms/Form";
import { DatePicker } from "@/components/2_molecules/Input/DatePicker";
import dayjs from "dayjs";
import { useToast } from "@/components/ui/use-toast";
import { ToastData } from "@/helpers/toastData";
import { useRouter } from "next/navigation";
import { validatePhoneNumber } from "@/helpers/validate";
import { useRef } from "react";
import useLoadingHandler from "@/helpers/customHook/useLoadingHandler";
import Logo from "@/components/1_atoms/Logo";
import type { KycUpdateProps } from "@/app/api/kyc/update";

export interface SettingsNotificationInitialValues {
  kyc_id: string;
  name: string;
  birthday: string;
  phone_number: string;
  email: string;
  step: number;
  isValidate: boolean;
}

const SettingsKYCView = () => {
  const { data: userData } = useGetQuery<UserAndSettings, undefined>(
    {
      queryKey: [QueryKey.account],
    },
    userGet
  );

  useEffectFunctionHook({
    Function: () => {
      if (userData?.profile?.kyc_id) {
        methods.setValue("kyc_id", userData.profile.kyc_id);
      }
      if (userData?.profile?.email) {
        methods.setValue("email", userData.profile.email);
      }
    },
    dependency: [userData],
  });

  const kycRef = useRef<HTMLIFrameElement>(null);

  const KYC_TARGET_ORIGIN = "https://kyc.useb.co.kr";
  const KYC_URL = "https://kyc.useb.co.kr/auth";

  const methods = useForm<SettingsNotificationInitialValues>({
    defaultValues: {
      kyc_id: "",
      name: "",
      birthday: "",
      phone_number: "",
      email: "",
      step: 0,
      isValidate: false,
    },
    reValidateMode: "onSubmit",
  });

  const { toast } = useToast();

  const router = useRouter();

  const { setLoading, disableLoading, queryClient } = useLoadingHandler();

  const startKYC = async () => {
    const step = methods.getValues("step");
    if (step === 0) {
      if (userData?.profile?.kyc_id) {
        return;
      }
      if (!userData?.profile?.email) {
        toast({
          id: ToastData.kycVerifyEmail,
          type: "error",
        });
        router.push(AppRoute.AccountSetting);
        return;
      }
      methods.setValue("step", 1);
      return;
    }
    if (step === 1) {
      const props = methods.getValues();
      const { hasData } = await get(ApiRoute.kyc);

      if (hasData && kycRef.current) {
        const params = {
          access_token: hasData,
          name: props.name,
          birthday: dayjs(props.birthday).format("YYYY-MM-DD"),
          phone_number: props.phone_number,
          email: props.email,
        };
        kycRef.current.onload = function () {
          const encodedParams = btoa(
            encodeURIComponent(JSON.stringify(params))
          ); // how to make a token by using base64 and url encoding
          kycRef.current!.contentWindow!.postMessage(
            encodedParams,
            KYC_TARGET_ORIGIN
          );
          disableLoading();
          kycRef.current!.onload = null;
          methods.setValue("step", 2);
        };

        setLoading();
        kycRef.current.src = KYC_URL;
      }
    }
  };

  const toastMessage = (message?: string) => {
    let value;
    switch (message) {
      case "CE002":
        value =
          "신분증 사진에서 얼굴을 감지하지 못하였 습니다. 다시 시도 부탁드립니다.";
        break;
      case "CE004":
        value = "실제 얼굴 여부 인증에 실패하였습니다. 다시 시도 부탁드립니다.";
        break;
      case "CF016":
        value =
          "계좌 실명인증 시 평생계좌번호(휴대폰번호)를 사용하여 실명인증에 실패한 경우입니다.\n다른계좌로 다시 시도 부탁드립니다.";
        break;
      case "CF018":
        value =
          "선택하신 신분증 선택 종류 제출하신 신분증 종류가 다릅니다.\n정확한 신분증 선택 후 다시 시도 부탁드립니다.";
        break;
      case "CF019":
        value = "신분증 발급일자가 인식되지 않습니다. 다시 시도 부탁드립니다.";
        break;
      case "SF001":
        value =
          "신분증에서 얼굴 감지에 실패하였습니다. 다시 시도 부탁드립니다.";
        break;
      case "SE001":
        value =
          "신분증에서 얼굴 감지에 실패하였습니다. 다시 시도 부탁드립니다.";
    }

    if (value)
      toast({
        id: ToastData.kycFail,
        type: "error",
        value,
      });
  };

  useEffectFunctionHook({
    Function: () => {
      window.addEventListener("message", async (e) => {
        try {
          const decodedData = decodeURIComponent(atob(e.data));
          const json = JSON.parse(decodedData);

          const json2 = structuredClone(json);
          if (json2 && json2.review_result && json2.review_result.id_card) {
            const review_result = json2 && json2.review_result;
            if (review_result.id_card) {
              const id_card = review_result.id_card;
              if (id_card.id_card_image) {
                id_card.id_card_image =
                  id_card.id_card_image.substring(0, 20) + "...생략...";
              }
              if (id_card.id_card_origin) {
                id_card.id_card_origin =
                  id_card.id_card_origin.substring(0, 20) + "...생략...";
              }
              if (id_card.id_crop_image) {
                id_card.id_crop_image =
                  id_card.id_crop_image.substring(0, 20) + "...생략...";
              }
            }

            if (review_result.face_check) {
              const face_check = review_result.face_check;
              if (face_check.selfie_image) {
                face_check.selfie_image =
                  face_check.selfie_image.substring(0, 20) + "...생략...";
              }
            }
          }

          if (json2 && json2.attachment) {
            const attachment = json2.attachment;
            for (const key in attachment) {
              if (attachment[key].id) {
                attachment[key].value =
                  attachment[key].value.substring(0, 20) + "...생략...";
              }
            }
          }

          // 데이터처리 부분
          if (json.result === "success") {
            // TODO: KYC 인증을 성공한 경우 데이터 처리
            // console.log(json.result + "결과 서버 저장");
            if (json.review_result.result_type === 1) {
              methods.setValue("isValidate", true);
            } else {
              toastMessage(json?.api_response?.message);
            }
            await postJson<KycUpdateProps>(ApiRoute.kycUpdate, {
              id: json.review_result.id,
              result_type: json.review_result.result_type,
              finance_code: json.review_result?.account?.finance_code ?? null,
              finance_company:
                json.review_result?.account?.finance_company ?? null,
              account_number:
                json.review_result?.account?.account_number ?? null,
              account_holder:
                json.review_result?.account?.account_holder ?? null,
              name: json.review_result?.name ?? null,
              phone_number: json.review_result?.phone_number ?? null,
              birthday: json.review_result?.birthday ?? null,
            });
            refreshCache(queryClient);
          } else if (json.result === "failed") {
            // TODO: KYC 인증을 실패한 경우 데이터 처리
            // console.log(json.result + "결과 서버 저장");
            toastMessage(json?.api_response?.message);
            await postJson<KycUpdateProps>(ApiRoute.kycUpdate, {
              id: json.review_result.id,
              result_type: json.review_result.result_type,
              finance_code: json.review_result?.account?.finance_code ?? null,
              finance_company:
                json.review_result?.account?.finance_company ?? null,
              account_number:
                json.review_result?.account?.account_number ?? null,
              account_holder:
                json.review_result?.account?.account_holder ?? null,
              name: json.review_result?.name ?? null,
              phone_number: json.review_result?.phone_number ?? null,
              birthday: json.review_result?.birthday ?? null,
            });
            refreshCache(queryClient);
          }

          // UI 처리
          else if (json.result === "complete") {
            // TODO: KYC 인증을 성공(자동승인 or 심사필요 케이스 모두 포함) 후 UI 처리
            // iframe이 포함된 UI를 종료
            // 고객사 서비스 UI를 다시 띄우고 상황에 맞는 UI 표시
            // 예시 : 자동승인 -> KYC인증이 완료되었습니다. 계좌개설이 완료되었습니다.
            // 예시 : 심사필요 -> KYC인증이 완료되었습니다. 심사가 완료된 이후 이메일로 안내 드리겠습니다.
            methods.setValue("step", 0);
            if (methods.getValues("isValidate") === true)
              toast({
                id: ToastData.kycSuccess,
                type: "success",
              });
          } else if (json.result === "close") {
            // TODO: KYC 인증을 실패(자동거부 or 중도이탈) 후 UI 처리
            // iframe이 포함된 UI를 종료
            // 고객사 서비스 UI를 다시 띄우고 상황에 맞는 UI 표시
            // 예시 : 자동거부 -> KYC인증이 실패하였습니다. 다시 인증을 시도후 서비스 이용이 가능합니다.
            methods.setValue("step", 0);
            toast({
              id: ToastData.kycCancel,
              type: "success",
            });
          } else {
            methods.setValue("step", 0);
            toast({
              id: ToastData.unknown,
              type: "error",
            });
            // invalid result
          }
        } catch (error) {
          // console.log("wrong data", error);
        }
      });
    },
    dependency: [],
  });

  return (
    <FormProvider {...methods}>
      <h3 className="flex gap-2 items-center">
        KYC 인증상태
        <span
          className={clsx(
            "w-4 h-4 rounded-full inline-block",
            typeof userData?.profile?.kyc_id === "string"
              ? "bg-green-500"
              : "bg-red-500"
          )}
        />
      </h3>
      <WithUseWatch name={["step"]}>
        {({ step }: SettingsNotificationInitialValues) => (
          <>
            {step === 0 && (
              <section
                className={clsx(
                  "flex flex-col items-center gap-4",
                  typeof userData?.profile?.kyc_id === "string" && "hidden"
                )}
              >
                <ShieldUser size={128} />
                <Button type="button" onClick={startKYC}>
                  KYC 인증 시작
                </Button>
              </section>
            )}
            {step === 1 && (
              <Form
                onSubmit={startKYC}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                <FormInput
                  name="name"
                  label="이름"
                  placeholder="이름을 입력해주세요"
                />
                <FormBuilder name="birthday" label="생년월일">
                  <DatePicker
                    name="birthday"
                    fromYear={dayjs().set("years", 1900).toDate()}
                    toYear={dayjs().toDate()}
                  />
                </FormBuilder>
                <FormInput
                  name="phone_number"
                  label="전화번호"
                  validate={validatePhoneNumber}
                  placeholder="전화번호를 입력해주세요(숫자만 입력)"
                />
                <FormInput name="email" readOnly label="이메일" />
                <Button type="submit">다음</Button>
              </Form>
            )}
            {step > 0 && (
              <div>
                <div
                  className={clsx(
                    step !== 2 && "hidden",
                    "fixed top-0 left-0 h-[calc(100vh-73px)] md:h-screen w-screen z-40"
                  )}
                >
                  <iframe
                    id="kyc_iframe"
                    ref={kycRef}
                    className="w-full h-full relative"
                    allow="camera"
                  ></iframe>
                  <div>
                    <Logo
                      href={AppRoute.Main}
                      className="absolute z-20 top-0 left-0 px-4 bg-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </WithUseWatch>
    </FormProvider>
  );
};

export default SettingsKYCView;
