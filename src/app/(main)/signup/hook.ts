import { useForm } from "react-hook-form";
import { QueryKey, type ValidateStatus } from "@/helpers/types";
import { ApiRoute } from "@/helpers/types";
import { AppRoute } from "@/helpers/types";
import { postJson } from "@/helpers/common";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import type { SignupProps } from "@/app/api/signup";
import { removeColumnsFromObject } from "@/helpers/basic";
import type { ToastData } from "@/helpers/toastData";
import { userSettingsGet } from "@/helpers/get";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import type { UserSettings } from "@/app/api/signup/read";
import { useMutation } from "@tanstack/react-query";

export interface SignupInitialValues extends SignupProps {
  passwordConfirm: string;
  status: ValidateStatus | "";
  otp: string;
  message?: ToastData;
}

const SignupHook = () => {
  const { data: userSettingData } = useGetQuery<UserSettings, undefined>(
    {
      queryKey: [QueryKey.signupSettings],
    },
    userSettingsGet,
    undefined,
    { silent: true }
  );

  const initialValues: () => SignupInitialValues = () => ({
    email: "",
    username: "",
    displayname: "",
    password: "",
    passwordConfirm: "",
    phone_number: "",
    status: "",
    request_id: "",
    otp: "",
  });

  const methods = useForm({
    defaultValues: initialValues(),
    reValidateMode: "onSubmit",
  });

  const router = useRouter();

  const { toast } = useToast();

  const trySignupMutation = useMutation({
    mutationFn: async (props: SignupInitialValues) => {
      const { hasMessage, isSuccess } = await postJson<SignupProps>(
        ApiRoute.signup,
        removeColumnsFromObject(props, ["passwordConfirm", "validate"])
      );
      if (hasMessage)
        toast({ id: hasMessage, type: isSuccess ? "success" : "error" });

      if (isSuccess) router.push(AppRoute.Main);
    },
  });

  const trySignup = (props: SignupInitialValues) => {
    if (trySignupMutation.isPending) return;
    trySignupMutation.mutate(props);
  };

  return {
    methods,
    trySignup,
    router,
    userSettingData,
    isSubmitting: trySignupMutation.isPending,
  };
};

export default SignupHook;
