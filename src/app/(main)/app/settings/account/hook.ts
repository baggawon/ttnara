import { useForm } from "react-hook-form";
import { useToast } from "@/components/ui/use-toast";
import type { UserAndSettings, ValidateStatus } from "@/helpers/types";
import { ApiRoute, AppRoute, QueryKey } from "@/helpers/types";
import useLoadingHandler from "@/helpers/customHook/useLoadingHandler";
import { postJson } from "@/helpers/common";
import useEffectFunctionHook from "@/helpers/customHook/useEffectFunction";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import { userGet, userSettingsGet } from "@/helpers/get";
import type { UserUpdateProps } from "@/app/api/user/update";
import { useRouter } from "next/navigation";
import type { ToastData } from "@/helpers/toastData";
import type { UserSettings } from "@/app/api/signup/read";
import { useRef } from "react";
import type { FormDialogMethods } from "@/components/1_atoms/FormDialog";
import { isCuid } from "@paralleldrive/cuid2";

export interface SettingsInitialValues {
  username: string;
  password: string;
  passwordConfirm: string;
  displayname: string;
  uid: string;
  email: string;
  status: ValidateStatus | "";
  otp: string;
  message?: ToastData;
  request_id?: string;
  changeEmail: boolean;
  prevDisplayname: string;
}

const SettingsHook = () => {
  const initialValues: () => SettingsInitialValues = () => ({
    username: "",
    password: "",
    passwordConfirm: "",
    displayname: "",
    uid: "",
    email: "",
    status: "",
    otp: "",
    changeEmail: false,
    prevDisplayname: "",
  });

  const { data: userData } = useGetQuery<UserAndSettings, undefined>(
    {
      queryKey: [QueryKey.account],
    },
    userGet
  );

  const { data: userSettingData } = useGetQuery<UserSettings, undefined>(
    {
      queryKey: [QueryKey.signupSettings],
    },
    userSettingsGet
  );

  const createRef = useRef<HTMLButtonElement | null>(null);
  const dialogControllRef = useRef<FormDialogMethods>(undefined);

  const isSimpleLoginUser =
    userData?.profile?.displayname &&
    isCuid(userData.profile.displayname) &&
    userData.profile.displayname.length === 24 &&
    typeof createRef.current?.click === "function";

  useEffectFunctionHook({
    Function: () => {
      if (userData) {
        methods.setValue("username", userData.username);
        if (userData.profile) {
          methods.setValue("displayname", userData.profile.displayname!);
          methods.setValue("prevDisplayname", userData.profile.displayname!);
          methods.setValue("uid", userData.id);
          if (userData.profile.email)
            methods.setValue("email", userData.profile.email);
        }
      }
    },
    dependency: [userData],
  });

  useEffectFunctionHook({
    Function: () => {
      if (isSimpleLoginUser) createRef.current?.click();
    },
    dependency: [isSimpleLoginUser],
  });

  const methods = useForm({
    defaultValues: initialValues(),
    reValidateMode: "onSubmit",
  });

  const { toast } = useToast();

  const router = useRouter();

  const { setLoading, disableLoading, queryClient } = useLoadingHandler();

  const trySave = async (props: SettingsInitialValues) => {
    setLoading();
    try {
      methods.setValue("password", "");
      methods.setValue("passwordConfirm", "");

      const { hasMessage, isSuccess } = await postJson<UserUpdateProps>(
        ApiRoute.userUpdate,
        {
          password: props.password,
          passwordConfirm: props.passwordConfirm,
          email: props.email,
          request_id: props.request_id,
          ...(props.prevDisplayname !== props.displayname && {
            displayname: props.displayname,
          }),
        }
      );
      if (hasMessage) {
        toast({ id: hasMessage, type: isSuccess ? "success" : "error" });
      }
      if (isSuccess) {
        queryClient.invalidateQueries({
          queryKey: [QueryKey.account],
        });
        queryClient.invalidateQueries({
          queryKey: [QueryKey.session],
        });
        router.push(AppRoute.Main);
      }
    } catch (error) {
      console.log("error", error);
    }
    disableLoading();
  };

  return {
    methods,
    trySave,
    userSettingData,
    dialogControllRef,
    createRef,
  };
};

export default SettingsHook;
