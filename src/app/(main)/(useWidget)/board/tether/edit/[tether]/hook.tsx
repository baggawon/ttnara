"use client";

import type {
  TetherListResponse,
  TetherWithProfile,
} from "@/app/api/tethers/read";
import { useToast } from "@/components/ui/use-toast";
import { filterMap, forEach } from "@/helpers/basic";
import { decimalToNumber, postJson } from "@/helpers/common";
import { useUserGuard } from "@/helpers/customHook/useGuard";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import useLoadingHandler from "@/helpers/customHook/useLoadingHandler";
import { tetherDefault } from "@/helpers/defaultValue";
import { tethersGet, userGet } from "@/helpers/get";
import { ToastData } from "@/helpers/toastData";
import {
  ApiRoute,
  AppRoute,
  QueryKey,
  TetherPriceTypes,
  type UserAndSettings,
} from "@/helpers/types";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import type { TetherUpdateProps } from "@/app/api/tethers/update";

export interface InnerTetherWithProfile extends TetherWithProfile {
  parent_id: number;
  isPasswordShow: boolean;
}

export const useTetherEditHook = (tether_id?: number) => {
  const pagination = {
    id: tether_id,
  };

  const { data: userData } = useGetQuery<UserAndSettings, undefined>(
    {
      queryKey: [QueryKey.account],
    },
    userGet
  );

  const { data: tethersData } = useGetQuery<TetherListResponse, any>(
    {
      queryKey: [{ [QueryKey.tethers]: pagination }],
      staleTime: Infinity,
    },
    tethersGet,
    pagination
  );

  const router = useRouter();

  const tether = tethersData?.tethers[0];
  const methods = useForm<InnerTetherWithProfile>({
    defaultValues: tether
      ? {
          ...tether,
          min_qty: decimalToNumber(tether.min_qty).toLocaleString(),
          max_qty: decimalToNumber(tether.max_qty).toLocaleString(),
          ...(tether.price && {
            price: decimalToNumber(tether.price).toLocaleString(),
          }),
          parent_id:
            tethersData?.tether_categories.find(
              (category) => category.name === tether.city
            )?.id ?? 0,
          isPasswordShow: false,
        }
      : {
          ...tetherDefault({
            id: tether_id,
            condition:
              "<p>1. KYC 인증이 완료된 회원과의 거래를 우선적으로 진행하시기를 권장드립니다.<br><br>2. KYC 인증이 완료되지 않은 회원과의 거래로 발생하는 문제에 대해서는 지원이 어려울 수 있습니다.<br><br>3. 거래 전, 텔레그램이나 카카오톡 등 메신저를 통한 추가 신원 확인 절차를 권장드립니다.<br><br>4. 본 플랫폼은 마약, 도박 등 불법 행위와 관련된 거래에 이용될 수 없습니다.</p>",
          }),
          parent_id: 0,
          isPasswordShow: false,
        },
    reValidateMode: "onSubmit",
  });

  useUserGuard();

  const goBackList = () => {
    router.push(AppRoute.Tether);
  };
  const { toast } = useToast();

  const { setLoading, disableLoading, queryClient } = useLoadingHandler();

  const editSave = async (props: InnerTetherWithProfile) => {
    setLoading();

    if (props.price_type === TetherPriceTypes.Fixed) {
      props.margin = null;
    } else if (props.price_type === TetherPriceTypes.Margin) {
      props.price = null;
    } else if (props.price_type === TetherPriceTypes.Negotiation) {
      props.price = null;
      props.margin = null;
    }

    forEach(["parent_id", "isPasswordShow"], (key) => {
      if (typeof (props as any)[key] !== undefined) {
        delete (props as any)[key];
      }
    });

    forEach(["city", "state", "price", "margin", "custom_address"], (key) => {
      if ((props as any)[key] === "" || (props as any)[key] === undefined) {
        (props as any)[key] = null;
      }
    });

    forEach(["price", "margin", "min_qty", "max_qty"], (key) => {
      if ((props as any)[key] !== null) {
        if (typeof (props as any)[key].toNumber === "function") {
          (props as any)[key] = (props as any)[key].toNumber();
        } else {
          (props as any)[key] = Number((props as any)[key].replaceAll(",", ""));
        }
      }
    });

    if (props.user) {
      props.user = null;
    }
    if (props.tether_proposals.length > 0) {
      props.tether_proposals = [];
    }

    try {
      const { isSuccess, hasMessage } = await postJson<TetherUpdateProps>(
        ApiRoute.tethersUpdate,
        props
      );
      if (hasMessage) {
        toast({ id: hasMessage, type: isSuccess ? "success" : "error" });
      }

      if (isSuccess) {
        methods.reset(tetherDefault());
        goBackList();
      }
    } catch (error) {
      toast({
        id: ToastData.unknown,
        type: "error",
      });
    }
    disableLoading();
  };

  const parentCategories: {
    label: string;
    value: string;
  }[] = filterMap(
    tethersData?.tether_categories ?? [],
    (category) =>
      category.parent_id === null && {
        label: category.name,
        value: category.name,
      }
  );

  const onParentChange = (value: string) => {
    methods.setValue("state", "");
    methods.setValue("city", value);
    const parent_id = tethersData?.tether_categories.find(
      (category) => category.name === value
    )?.id;
    if (parent_id) methods.setValue("parent_id", parent_id);
  };

  return {
    methods,
    tethersData,
    goBackList,
    editSave,
    parentCategories,
    onParentChange,
    userData,
  };
};
