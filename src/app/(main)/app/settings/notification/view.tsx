"use client";

import { FormBuilder } from "@/components/2_molecules/Input/FormInput";
import { FormProvider, useForm } from "react-hook-form";
import { postJson } from "@/helpers/common";
import useEffectFunctionHook from "@/helpers/customHook/useEffectFunction";
import {
  ApiRoute,
  QueryKey,
  type UserAndSettings,
  UserSettings,
} from "@/helpers/types";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import { userGet } from "@/helpers/get";
import type { SettingsUpdateProps } from "@/app/api/settings/update";
import { SwitchInput } from "@/components/2_molecules/Input/SwitchInput";
import PushNotification from "@/components/1_atoms/PushNotification";

export interface SettingsNotificationInitialValues {
  settings: {
    [key in UserSettings]: boolean;
  };
}

const SettingsNotificationView = () => {
  const initialValues: () => SettingsNotificationInitialValues = () => ({
    settings: {
      ...Object.keys(UserSettings).reduce(
        (prev: any, current) => {
          prev[current] = false;
          return prev;
        },
        {} as { [key in UserSettings]: boolean }
      ),
    },
  });

  const { data: userData } = useGetQuery<UserAndSettings, undefined>(
    {
      queryKey: [QueryKey.account],
    },
    userGet
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

  const methods = useForm({
    defaultValues: initialValues(),
    reValidateMode: "onSubmit",
  });

  const trySave = async () => {
    const props = methods.getValues();
    await postJson<SettingsUpdateProps>(ApiRoute.settingsUpdate, {
      settings: props.settings,
    });
  };

  return (
    <FormProvider {...methods}>
      <PushNotification />
      <FormBuilder name="tether_notification" label="거래요청 알림">
        <SwitchInput
          name="settings.tether_notification"
          onCheckedChange={(value) => {
            methods.setValue("settings.tether_notification", value as never);
            trySave();
          }}
        />
      </FormBuilder>
      <FormBuilder name="message_notification" label="쪽지 알림">
        <SwitchInput
          name="settings.message_notification"
          onCheckedChange={(value) => {
            methods.setValue("settings.message_notification", value as never);
            trySave();
          }}
        />
      </FormBuilder>
    </FormProvider>
  );
};

export default SettingsNotificationView;
