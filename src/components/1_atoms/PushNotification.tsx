import type { PushUpdateProps } from "@/app/api/push/update";
import { useToast } from "@/components/ui/use-toast";
import { postJson } from "@/helpers/common";
import useEffectFunctionHook from "@/helpers/customHook/useEffectFunction";
import { ApiRoute, PushType } from "@/helpers/types";
import { useState } from "react";

export interface PushNotificationState {
  supported: boolean;
  isSubscribed: boolean;
  toggle: () => void;
  reload: () => void;
}

export const usePushNotification = (): PushNotificationState => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [registration, setRegistration] =
    useState<ServiceWorkerRegistration | null>(null);
  const [supported, setSupported] = useState(true);

  const { toast } = useToast();

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

  const subscribeInput = async (data: string) => {
    const { isSuccess, hasMessage } = await postJson<PushUpdateProps>(
      ApiRoute.pushUpdate,
      {
        data,
        type: PushType.Subscribe,
      }
    );

    if (!isSuccess) {
      setIsSubscribed(false);
    } else {
      setIsSubscribed(true);
    }
    if (hasMessage)
      toast({ id: hasMessage, type: isSuccess ? "success" : "error" });
  };

  const unSubscribeInput = async (data: string) => {
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
  };

  // Service Worker 등록
  useEffectFunctionHook({
    Function: () => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setSupported(false);
        return;
      }

      const registerServiceWorker = async () => {
        try {
          const reg = await navigator.serviceWorker.register(
            "/service-worker.js",
            { scope: "/" }
          );
          setRegistration(reg);

          // 구독 상태 체크
          const subscription = await reg.pushManager.getSubscription();
          if (subscription) {
            const subscriptionInfo = subscription.toJSON();
            if (subscriptionInfo.endpoint) {
              setIsSubscribed(true);
              subscribeInput(JSON.stringify(subscription));
            } else {
              await subscription.unsubscribe();
              setIsSubscribed(false);
            }
          } else {
            setIsSubscribed(false);
          }
        } catch (err) {
          console.error("Service Worker 등록 실패:", err);
          setSupported(false);
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
        toast({
          id: "알림 권한이 거부되었습니다. 브라우저 설정에서 알림을 허용해주세요.",
          type: "error",
        });
        return;
      }

      if (!registration) {
        toast({
          id: "서비스 워커가 준비되지 않았습니다. 페이지를 새로고침해주세요.",
          type: "error",
        });
        return;
      }

      const publicVapidKey = (window as any).CLIENT_VAPID_PUBLIC_KEY;
      if (!publicVapidKey) {
        toast({ id: "VAPID 키가 설정되지 않았습니다.", type: "error" });
        return;
      }

      const applicationServerKey = urlB64ToUint8Array(publicVapidKey);

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey,
      });

      await subscribeInput(JSON.stringify(subscription));
    } catch (err) {
      console.error("알림 구독 실패:", err);
      toast({
        id: `알림 구독 실패: ${err instanceof Error ? err.message : String(err)}`,
        type: "error",
      });
    }
  };

  // 구독 취소
  const unsubscribeFromNotifications = async () => {
    try {
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        await unSubscribeInput(JSON.stringify(subscription));
      }
    } catch (err) {
      console.error("구독 취소 실패:", err);
      toast({
        id: `구독 취소 실패: ${err instanceof Error ? err.message : String(err)}`,
        type: "error",
      });
    }
  };

  return {
    supported,
    isSubscribed,
    toggle: isSubscribed
      ? unsubscribeFromNotifications
      : subscribeToNotifications,
    reload: () => window.location.reload(),
  };
};
