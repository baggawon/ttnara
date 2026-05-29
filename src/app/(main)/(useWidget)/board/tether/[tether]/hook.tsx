"use client";

import { useForm, type UseFormReturn } from "react-hook-form";
import { forEach } from "@/helpers/basic";
import { usePriceProvider } from "@/helpers/customHook/usePriceProvider";
import { useRouter } from "next/navigation";
import {
  ApiRoute,
  AppRoute,
  QueryKey,
  TetherAddressTypes,
  TetherStatus,
} from "@/helpers/types";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import type {
  TetherListResponse,
  TetherWithProfile,
  TradeProposalWithProfile,
} from "@/app/api/tethers/read";
import { sessionGet, tethersGet } from "@/helpers/get";
import type { Session } from "next-auth";
import { decimalToNumber, postJson } from "@/helpers/common";
import useEffectFunctionHook from "@/helpers/customHook/useEffectFunction";
import type { tether_proposal, tether_rate } from "@prisma/client";
import {
  tetherProposalDefault,
  tetherRateDefault,
} from "@/helpers/defaultValue";
import { useToast } from "@/components/ui/use-toast";
import { useMutation } from "@tanstack/react-query";
import { ToastData } from "@/helpers/toastData";
import type { TetherProposalUpdateProps } from "@/app/api/tethers/proposal/update";
import { type RefObject, useRef } from "react";
import { type FormDialogMethods } from "@/components/1_atoms/FormDialog";
import type { TetherProposalRateUpdateProps } from "@/app/api/tethers/proposal/rate/update";
import type { tethersDeleteProps } from "@/app/api/tethers/delete";

export interface ProposalMethods extends tether_proposal {}

export const useTetherDetail = ({ tether_id }: { tether_id?: number }) => {
  const { data: session } = useGetQuery<Session | null | undefined, undefined>(
    {
      queryKey: [QueryKey.session],
    },
    sessionGet,
    undefined,
    { silent: true }
  );

  const pagination = {
    ...(typeof tether_id === "number" && { id: tether_id }),
  };

  const { data: tethersData } = useGetQuery<TetherListResponse, any>(
    {
      queryKey: [{ [QueryKey.tethers]: pagination }],
    },
    tethersGet,
    pagination,
    { silent: true }
  );

  const currentTether = tethersData?.tethers?.[0] as
    | TetherWithProfile
    | undefined;

  useEffectFunctionHook({
    Function: () => {
      if (tethersData?.tethers.length === 0) {
        router.push(AppRoute.Tether);
      } else if (session?.user && currentTether) {
        if (
          (currentTether.status !== TetherStatus.Open &&
            !getOwner() &&
            !getIsProposer()) ||
          currentTether.status === TetherStatus.Cancel
        ) {
          if (currentTether.status === TetherStatus.Cancel)
            toast({
              id: ToastData.tetherAlreadyCancel,
              type: "error",
            });
          router.push(AppRoute.Tether);
        }
      }
    },
    dependency: [tethersData, session, currentTether],
  });

  const getOwner = () =>
    session !== null &&
    session !== undefined &&
    session.user?.displayname &&
    currentTether?.user?.profile?.displayname &&
    session.user?.displayname === currentTether?.user?.profile?.displayname;

  const owner = getOwner();

  const getIsProposer = () =>
    session !== null &&
    session !== undefined &&
    session.user?.displayname &&
    currentTether?.user?.profile?.displayname &&
    session.user?.displayname !== currentTether?.user?.profile?.displayname;

  const isProposer = getIsProposer();

  const methods = useForm<ProposalMethods>({
    defaultValues: tetherProposalDefault({
      tether_id,
    }),
    reValidateMode: "onSubmit",
  });

  useEffectFunctionHook({
    Function: () => {
      if (currentTether?.price) {
        methods.setValue("price", currentTether.price);
      }
    },
    dependency: [currentTether],
  });

  const router = useRouter();

  const goEdit = () => {
    router.push(`${AppRoute.Tether}/edit/${tether_id}`);
  };

  const { control } = usePriceProvider();

  const calculateTotal = (qty: string, price: string) => {
    if (qty !== "" && price !== "" && currentTether) {
      qty = qty.replaceAll(",", "");
      if (currentTether.price) {
        return (
          decimalToNumber(currentTether.price) * Number(qty)
        ).toLocaleString();
      } else if (currentTether.margin) {
        return (
          (Number(price) +
            (Number(price) * decimalToNumber(currentTether.margin)) / 100) *
          Number(qty)
        ).toLocaleString();
      }
    }
    return "0";
  };

  const { toast } = useToast();

  const dialogControllRef = useRef<FormDialogMethods>(undefined);

  const tryTradeMutation = useMutation({
    mutationFn: async (props: ProposalMethods) => {
      forEach(["telegram_id", "kakao_id"], (key) => {
        if ((props as any)[key] === "" || (props as any)[key] === undefined) {
          (props as any)[key] = null;
        }
      });

      forEach(["qty", "price"], (key) => {
        if ((props as any)[key] !== null) {
          if (typeof (props as any)[key].toNumber === "function") {
            (props as any)[key] = (props as any)[key].toNumber();
          } else {
            (props as any)[key] = Number(
              (props as any)[key].replaceAll(",", "")
            );
          }
        }
      });

      const { isSuccess, hasMessage } =
        await postJson<TetherProposalUpdateProps>(
          ApiRoute.tethersProposalUpdate,
          props
        );
      if (hasMessage) {
        toast({ id: hasMessage, type: isSuccess ? "success" : "error" });
      }

      if (isSuccess) {
        methods.reset(tetherProposalDefault());
        router.refresh();
      }
    },
    onError: () => {
      toast({ id: ToastData.unknown, type: "error" });
    },
  });

  const tryTrade = (props: ProposalMethods) => {
    if (tryTradeMutation.isPending) return;
    tryTradeMutation.mutate(props);
  };

  const submitRateMutation = useMutation({
    mutationFn: async (vars: {
      props: tether_rate;
      cancelRef: RefObject<HTMLButtonElement | null>;
      methods: UseFormReturn<any, any, undefined>;
    }) => {
      const { props, cancelRef, methods: rateMethods } = vars;
      const { isSuccess, hasMessage } =
        await postJson<TetherProposalRateUpdateProps>(
          ApiRoute.tethersProposalRateUpdate,
          props
        );
      if (hasMessage) {
        toast({ id: hasMessage, type: isSuccess ? "success" : "error" });
      }

      if (isSuccess) {
        rateMethods.reset(
          tetherRateDefault({ tether_proposal_id: props.tether_proposal_id })
        );
        router.push(AppRoute.Tether);
        cancelRef.current?.click();
      }
    },
    onError: () => {
      toast({ id: ToastData.unknown, type: "error" });
    },
  });

  const submitRate = (
    props: tether_rate,
    cancelRef: RefObject<HTMLButtonElement | null>,
    rateMethods: UseFormReturn<any, any, undefined>
  ) => {
    if (submitRateMutation.isPending) return;
    submitRateMutation.mutate({ props, cancelRef, methods: rateMethods });
  };

  // Both parties submit a rating via the same endpoint; the backend finalizes
  // the trade when the second rating arrives.
  const proposalConfirm = submitRate;
  const ownerConfirm = submitRate;

  const buildCancelProps = (): TradeProposalWithProfile | null => {
    if (!currentTether) return null;
    const props: TradeProposalWithProfile = {
      ...(currentTether.tether_proposals[0] as TradeProposalWithProfile),
      status: TetherStatus.Cancel,
    };

    forEach(["price", "qty"], (key) => {
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
    return props;
  };

  const cancelProposalRequest = async (props: TradeProposalWithProfile) => {
    const { isSuccess, hasMessage } = await postJson<TetherProposalUpdateProps>(
      ApiRoute.tethersProposalUpdate,
      props
    );
    if (hasMessage) {
      toast({ id: hasMessage, type: isSuccess ? "success" : "error" });
    }
    if (isSuccess) {
      methods.reset(tetherProposalDefault({ tether_id }));
      router.refresh();
    }
  };

  const proposalCancelMutation = useMutation({
    mutationFn: async () => {
      const props = buildCancelProps();
      if (!props) return;
      await cancelProposalRequest(props);
    },
    onError: () => {
      toast({ id: ToastData.unknown, type: "error" });
    },
  });

  const proposalCancel = () => {
    if (proposalCancelMutation.isPending) return;
    proposalCancelMutation.mutate();
  };

  const ownerCancelMutation = useMutation({
    mutationFn: async () => {
      const props = buildCancelProps();
      if (!props) return;
      await cancelProposalRequest(props);
    },
    onError: () => {
      toast({ id: ToastData.unknown, type: "error" });
    },
  });

  const ownerCancel = () => {
    if (ownerCancelMutation.isPending) return;
    ownerCancelMutation.mutate();
  };

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!currentTether) return;
      const { isSuccess, hasMessage } = await postJson<tethersDeleteProps>(
        ApiRoute.tethersDelete,
        { deleteTetherId: currentTether.id }
      );
      if (hasMessage) {
        toast({ id: hasMessage, type: isSuccess ? "success" : "error" });
      }
      if (isSuccess) {
        router.push(AppRoute.Tether);
      }
    },
    onError: () => {
      toast({ id: ToastData.unknown, type: "error" });
    },
  });

  const tryDelete = () => {
    if (deleteMutation.isPending) return;
    deleteMutation.mutate();
  };

  const getAddress = () => {
    if (currentTether?.address_type === TetherAddressTypes.Category) {
      const regions = (currentTether as TetherWithProfile).region_selections;
      if (!regions || regions.length === 0) return "";
      return regions
        .map((r) => r.category?.name ?? "")
        .filter(Boolean)
        .join(", ");
    }
    return currentTether?.custom_address ?? "";
  };

  return {
    currentTether,
    categories: tethersData?.tether_categories ?? [],
    control,
    methods,
    goEdit,
    owner,
    isProposer,
    tryTrade,
    calculateTotal,
    proposalConfirm,
    proposalCancel,
    ownerConfirm,
    ownerCancel,
    tryDelete,
    dialogControllRef,
    getAddress,
    sessionUid: session?.user?.id ?? null,
    isTrading: tryTradeMutation.isPending,
    isRating: submitRateMutation.isPending,
    isProposalCancelling: proposalCancelMutation.isPending,
    isOwnerCancelling: ownerCancelMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
