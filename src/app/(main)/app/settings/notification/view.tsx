"use client";

import { FormProvider, useForm } from "react-hook-form";
import { postJson, refreshCache } from "@/helpers/common";
import useEffectFunctionHook from "@/helpers/customHook/useEffectFunction";
import {
  ApiRoute,
  QueryKey,
  type UserAndSettings,
  UserSettings,
} from "@/helpers/types";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import { useQueryClient } from "@tanstack/react-query";
import { userGet } from "@/helpers/get";
import type { SettingsUpdateProps } from "@/app/api/settings/update";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePushNotification } from "@/components/1_atoms/PushNotification";
import { useTetherEnabled } from "@/helpers/customHook/useTetherEnabled";
import { useWatch } from "react-hook-form";
import { cn } from "@/components/lib/utils";
import {
  BellRing,
  MessageSquare,
  MessagesSquare,
  Coins,
  AlertTriangle,
} from "lucide-react";
import type { ReactNode } from "react";

export interface SettingsNotificationInitialValues {
  settings: {
    [key in UserSettings]: boolean;
  };
}

interface ToggleRowProps {
  icon: ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  disabled?: boolean;
}

const ToggleRow = ({
  icon,
  title,
  description,
  checked,
  onCheckedChange,
  disabled,
}: ToggleRowProps) => (
  <div
    className={cn(
      "flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0",
      disabled && "opacity-60"
    )}
  >
    <div className="flex items-start gap-3 min-w-0 flex-1">
      <div className="mt-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/40 p-1.5 text-emerald-600 dark:text-emerald-400 shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-medium leading-none">{title}</div>
        <p className="text-xs text-muted-foreground mt-1.5 leading-snug">
          {description}
        </p>
      </div>
    </div>
    <Switch
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className="shrink-0 mt-0.5"
    />
  </div>
);

const FormToggleRow = ({
  name,
  icon,
  title,
  description,
  onSave,
}: {
  name: `settings.${UserSettings}`;
  icon: ReactNode;
  title: string;
  description: string;
  onSave: (next: boolean) => void;
}) => {
  const value = useWatch({ name }) as boolean | undefined;
  return (
    <ToggleRow
      icon={icon}
      title={title}
      description={description}
      checked={!!value}
      onCheckedChange={(next) => onSave(next)}
    />
  );
};

const SettingsNotificationView = () => {
  const initialValues: () => SettingsNotificationInitialValues = () => ({
    settings: {
      ...Object.keys(UserSettings).reduce(
        (prev: any, current) => {
          prev[current] = true;
          return prev;
        },
        {} as { [key in UserSettings]: boolean }
      ),
    },
  });

  const methods = useForm({
    defaultValues: initialValues(),
    reValidateMode: "onSubmit",
  });

  const { data: userData } = useGetQuery<UserAndSettings, undefined>(
    {
      queryKey: [QueryKey.account],
    },
    userGet,
    undefined,
    { silent: true }
  );

  useEffectFunctionHook({
    Function: () => {
      if (userData) {
        if (Object.keys(userData.settings).length > 0) {
          methods.setValue("settings", {
            ...methods.getValues("settings"),
            ...userData.settings,
          });
        }
      }
    },
    dependency: [userData],
  });

  const queryClient = useQueryClient();
  const tetherEnabled = useTetherEnabled();
  const push = usePushNotification();

  const trySave = async (key: UserSettings, value: boolean) => {
    methods.setValue(`settings.${key}`, value as never);
    const currentSettings = methods.getValues("settings");
    await postJson<SettingsUpdateProps>(ApiRoute.settingsUpdate, {
      settings: { ...currentSettings, [key]: value },
    });
    refreshCache(queryClient, QueryKey.account);
  };

  return (
    <FormProvider {...methods}>
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <BellRing className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              푸시 알림
            </CardTitle>
            <CardDescription>
              브라우저 또는 기기에서 즉시 받는 푸시 알림입니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {push.supported ? (
              <ToggleRow
                icon={<BellRing className="w-4 h-4" />}
                title="푸시 알림 구독"
                description="기기의 푸시 알림 권한을 허용합니다."
                checked={push.isSubscribed}
                onCheckedChange={push.toggle}
              />
            ) : (
              <div className="flex items-start gap-3 rounded-md border border-amber-200 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-950/30 p-3 text-sm">
                <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium">
                    이 브라우저에서는 푸시 알림을 사용할 수 없습니다.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    오류가 반복되면 고객센터에 문의해 주세요.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={push.reload}
                >
                  재시도
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <BellRing className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              알림 종류
            </CardTitle>
            <CardDescription>
              어떤 활동에 대해 알림을 받을지 선택합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="divide-y">
            {tetherEnabled && (
              <FormToggleRow
                name="settings.tether_notification"
                icon={<Coins className="w-4 h-4" />}
                title="거래요청 알림"
                description="내 게시글에 거래 요청이 들어왔을 때 알림을 받습니다."
                onSave={(next) =>
                  trySave(UserSettings.tether_notification, next)
                }
              />
            )}
            <FormToggleRow
              name="settings.message_notification"
              icon={<MessageSquare className="w-4 h-4" />}
              title="쪽지 알림"
              description="새로운 쪽지가 도착하면 알림을 받습니다."
              onSave={(next) =>
                trySave(UserSettings.message_notification, next)
              }
            />
            <FormToggleRow
              name="settings.board_notification"
              icon={<MessagesSquare className="w-4 h-4" />}
              title="게시판 알림"
              description="내가 작성한 글에 댓글이 달리면 알림을 받습니다."
              onSave={(next) => trySave(UserSettings.board_notification, next)}
            />
          </CardContent>
        </Card>
      </div>
    </FormProvider>
  );
};

export default SettingsNotificationView;
