"use client";

import type {
  TetherListResponse,
  TetherWithProfile,
} from "@/app/api/tethers/read";
import { useToast } from "@/components/ui/use-toast";
import { forEach } from "@/helpers/basic";
import { decimalToNumber, postJson } from "@/helpers/common";
import { useUserGuard } from "@/helpers/customHook/useGuard";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import { tetherDefault } from "@/helpers/defaultValue";
import { useMutation } from "@tanstack/react-query";
import {
  attachedMediaGet,
  tethersGet,
  tetherSettingsGet,
  userGet,
} from "@/helpers/get";
import type { MediaUploadResult } from "@/app/api/uploads/media";
import type { TetherPublicSettings } from "@/app/api/tether/settings/read";
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
  region_category_ids: number[];
}

export const useTetherEditHook = (tether_id?: number) => {
  const pagination = {
    id: tether_id,
  };

  const { data: userData } = useGetQuery<UserAndSettings, undefined>(
    {
      queryKey: [QueryKey.account],
    },
    userGet,
    undefined,
    { silent: true }
  );

  const { data: tethersData } = useGetQuery<TetherListResponse, any>(
    {
      queryKey: [{ [QueryKey.tethers]: pagination }],
      staleTime: Infinity,
    },
    tethersGet,
    pagination,
    { silent: true }
  );

  const { data: tetherSettings } = useGetQuery<TetherPublicSettings, undefined>(
    {
      queryKey: [QueryKey.tetherSettings],
      staleTime: Infinity,
    },
    tetherSettingsGet,
    undefined,
    { silent: true }
  );

  const { data: attachedMedia } = useGetQuery<
    MediaUploadResult[],
    { attached_to_type: string; attached_to_id: number }
  >(
    {
      queryKey: [
        {
          [QueryKey.attachedMedia]: { type: "tether", id: tether_id ?? 0 },
        },
      ],
      staleTime: Infinity,
      enabled: !!tether_id && tether_id > 0,
    },
    attachedMediaGet,
    { attached_to_type: "tether", attached_to_id: tether_id ?? 0 },
    { silent: true }
  );

  const router = useRouter();

  const tether = tethersData?.tethers[0] as TetherWithProfile | undefined;
  const methods = useForm<InnerTetherWithProfile>({
    defaultValues: tether
      ? {
          ...tether,
          min_qty: decimalToNumber(tether.min_qty).toLocaleString() as any,
          max_qty: decimalToNumber(tether.max_qty).toLocaleString() as any,
          ...(tether.price && {
            price: decimalToNumber(tether.price).toLocaleString() as any,
          }),
          hide_contact:
            tether.hide_contact ||
            (tether.contact_method === null && tether.contact_id === null),
          region_category_ids:
            tether.region_selections?.map((r) => r.category_id) ?? [],
        }
      : {
          ...tetherDefault({
            id: tether_id,
            condition:
              "1. KYC 인증이 완료된 회원과의 거래를 우선적으로 진행하시기를 권장드립니다.\n\n2. KYC 인증이 완료되지 않은 회원과의 거래로 발생하는 문제에 대해서는 지원이 어려울 수 있습니다.\n\n3. 거래 전, 텔레그램이나 카카오톡 등 메신저를 통한 추가 신원 확인 절차를 권장드립니다.\n\n4. 본 플랫폼은 마약, 도박 등 불법 행위와 관련된 거래에 이용될 수 없습니다.",
          }),
        },
    reValidateMode: "onSubmit",
  });

  useUserGuard();

  const goBackList = () => {
    router.push(AppRoute.Tether);
  };
  const { toast } = useToast();

  const editSaveMutation = useMutation({
    mutationFn: async (props: InnerTetherWithProfile) => {
      if (props.price_type === TetherPriceTypes.Fixed) {
        props.margin = null;
      } else if (props.price_type === TetherPriceTypes.Margin) {
        props.price = null;
      } else if (props.price_type === TetherPriceTypes.Negotiation) {
        props.price = null;
        props.margin = null;
      }

      forEach(["price", "margin", "custom_address"], (key) => {
        if ((props as any)[key] === "" || (props as any)[key] === undefined) {
          (props as any)[key] = null;
        }
      });

      forEach(["price", "margin", "min_qty", "max_qty"], (key) => {
        if ((props as any)[key] !== null) {
          if (typeof (props as any)[key]?.toNumber === "function") {
            (props as any)[key] = (props as any)[key].toNumber();
          } else {
            (props as any)[key] = Number(
              String((props as any)[key]).replaceAll(",", "")
            );
          }
        }
      });

      if (props.hide_contact) {
        props.contact_method = null;
        props.contact_id = null;
        props.preferred_time = null;
      } else {
        forEach(["contact_method", "contact_id", "preferred_time"], (key) => {
          if ((props as any)[key] === "" || (props as any)[key] === undefined) {
            (props as any)[key] = null;
          }
        });
      }

      if (props.user) {
        props.user = null;
      }
      if (props.tether_proposals?.length > 0) {
        props.tether_proposals = [];
      }
      delete (props as any).region_selections;

      const { isSuccess, hasMessage } = await postJson<TetherUpdateProps>(
        ApiRoute.tethersUpdate,
        props as unknown as TetherUpdateProps
      );
      if (hasMessage) {
        toast({ id: hasMessage, type: isSuccess ? "success" : "error" });
      }

      if (isSuccess) {
        methods.reset(tetherDefault() as any);
        goBackList();
      }
    },
    onError: () => {
      toast({ id: ToastData.unknown, type: "error" });
    },
  });

  const editSave = (props: InnerTetherWithProfile) => {
    if (editSaveMutation.isPending) return;
    editSaveMutation.mutate(props);
  };

  return {
    methods,
    tethersData,
    tetherSettings,
    attachedMedia,
    goBackList,
    editSave,
    userData,
    isSubmitting: editSaveMutation.isPending,
  };
};
