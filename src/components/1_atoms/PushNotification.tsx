import type { PushUpdateProps } from "@/app/api/push/update";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { postJson } from "@/helpers/common";
import useEffectFunctionHook from "@/helpers/customHook/useEffectFunction";
import useLoadingHandler from "@/helpers/customHook/useLoadingHandler";
import { ApiRoute, PushType } from "@/helpers/types";
import { AlarmClock } from "lucide-react";
import React, { useState } from "react";

const PushNotification = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [registration, setRegistration] =
    useState<ServiceWorkerRegistration | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { toast } = useToast();

  const { setLoading, disableLoading } = useLoadingHandler();

  const subscribeInput = async (data: string) => {
    setLoading();
    const { isSuccess, hasMessage } = await postJson<PushUpdateProps>(
      ApiRoute.pushUpdate,
      {
        data,
        type: PushType.Subscribe,
      }
    );

    if (!isSuccess) {
      const subscription = await registration?.pushManager.getSubscription();
      await subscription?.unsubscribe();
      setIsSubscribed(false);
    } else if (isSuccess) {
      setIsSubscribed(true);
    }
    if (hasMessage)
      toast({ id: hasMessage, type: isSuccess ? "success" : "error" });
    disableLoading();
  };

  const unSubscribeInput = async (data: string) => {
    setLoading();
    const { isSuccess, hasMessage } = await postJson<PushUpdateProps>(
      ApiRoute.pushUpdate,
      {
        data,
        type: PushType.Unsubscribe,
      }
    );

    setIsSubscribed(false);
    if (hasMessage)
      toast({ id: hasMessage, type: isSuccess ? "success" : "error" });
    disableLoading();
  };

  // Service Worker 등록
  useEffectFunctionHook({
    Function: () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setError("Push 알림이 지원되지 않는 브라우저입니다.");
        return;
      }

      const registerServiceWorker = async () => {
        try {
          const registration = await navigator.serviceWorker.register(
            "/service-worker.js",
            {
              scope: "/", // scope를 현재 경로에 맞게 설정
            }
          );
          setRegistration(registration);

          // 구독 상태 체크
          const subscription = await registration.pushManager.getSubscription();
          setIsSubscribed(!!subscription);
          if (subscription) {
            try {
              // 구독이 유효한지 확인 (옵션)
              const subscriptionInfo = subscription.toJSON();
              if (subscriptionInfo.endpoint) {
                setIsSubscribed(true);
                subscribeInput(JSON.stringify(subscription));
              } else {
                // 엔드포인트가 없다면 구독이 유효하지 않으므로 취소
                await subscription.unsubscribe();
                setIsSubscribed(false);
              }
            } catch (error) {
              // 구독이 유효하지 않다면 재구독
              // VAPID 공개키 (서버에서 제공받아야 함)
              const publicVapidKey = (window as any).CLIENT_VAPID_PUBLIC_KEY!;
              const applicationServerKey = urlB64ToUint8Array(publicVapidKey);

              const subscription = await registration?.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: applicationServerKey,
              });

              // 서버에 구독 정보 전송
              subscribeInput(JSON.stringify(subscription));
            }
          } else {
            setIsSubscribed(false);
          }
          if (!!subscription) {
            subscribeInput(JSON.stringify(subscription));
          }
        } catch (err) {
          setError("Service Worker 등록 실패: " + err);
        }
      };

      registerServiceWorker();
    },
    dependency: [],
  });

  // 알림 구독
  const subscribeToNotifications = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        throw new Error("알림 권한이 거부되었습니다.");
      }

      // VAPID 공개키 (서버에서 제공받아야 함)
      const publicVapidKey = (window as any).CLIENT_VAPID_PUBLIC_KEY!;
      const applicationServerKey = urlB64ToUint8Array(publicVapidKey);

      const subscription = await registration?.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey,
      });

      // 서버에 구독 정보 전송
      subscribeInput(JSON.stringify(subscription));
    } catch (err) {
      setError("알림 구독 실패: " + err);
    }
  };

  // 구독 취소
  const unsubscribeFromNotifications = async () => {
    try {
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        // 서버에 구독 취소 알림
        await subscription.unsubscribe();
        unSubscribeInput(JSON.stringify(subscription));
      }
    } catch (err) {
      setError("구독 취소 실패: " + err);
    }
  };

  // VAPID 키를 Uint8Array로 변환
  const urlB64ToUint8Array = (base64String: string) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  if (typeof error === "string") console.log(error);
  return !error ? (
    <div className="relative w-full">
      <div className="grid gap-4">
        <div className="flex items-center space-x-1 whitespace-nowrap">
          <Label htmlFor="alarm" className="flex gap-2 items-center">
            <span>
              <AlarmClock className="max-w-[20px] max-h-[20px]" />
            </span>
            알림 구독
          </Label>
        </div>
        <Switch
          checked={isSubscribed}
          onCheckedChange={
            isSubscribed
              ? unsubscribeFromNotifications
              : subscribeToNotifications
          }
          id="alarm"
        />
      </div>
    </div>
  ) : (
    <Label>
      <br />
      알림을 지원하지 않거나 일시적인 오류 입니다.
      <br />
      계속 오류난다면 고객센터에 문의바랍니다.
      <br /> 감사합니다.
      <br />
      <Button
        className="mt-2"
        type="button"
        onClick={() => window.location.reload()}
      >
        재시도
      </Button>
    </Label>
  );
};

PushNotification.displayName = "PushNotification";

export default PushNotification;
