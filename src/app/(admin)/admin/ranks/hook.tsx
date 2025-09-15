"use client";

import type { trade_rank } from "@prisma/client";
import type { RanksDeleteProps } from "@/app/api/admin_di2u3k2j/ranks/delete";
import type {
  RanksListResponse,
  RanksReadProps,
} from "@/app/api/admin_di2u3k2j/ranks/read";
import ConfirmDialog from "@/components/1_atoms/ConfirmDialog";
import type { CustomColumDef } from "@/components/2_molecules/Table/DataTable";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { postJson, refreshCache } from "@/helpers/common";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import useLoadingHandler from "@/helpers/customHook/useLoadingHandler";
import { adminRanksGet } from "@/helpers/get";
import { setDefaultColumn } from "@/helpers/makeComponent";
import { ToastData } from "@/helpers/toastData";
import { AdminAppRoute, ApiRoute, QueryKey } from "@/helpers/types";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

export interface AdminRanksMethods {
  page: string;
  pageSize: string;
  order: string;
  search: string;
  searchField: "name" | "rank_level" | "description";
  rank_id?: number;
}

export const useAdminRanksHook = () => {
  const [pagination, setPagination] = useState<RanksReadProps>({
    page: 1,
    pageSize: 10,
  });

  const { data: ranksData } = useGetQuery<RanksListResponse, RanksReadProps>(
    {
      queryKey: [{ [QueryKey.ranks]: pagination }],
    },
    adminRanksGet,
    pagination
  );

  const updatePagination = () => {
    const prevProps = methods.getValues();
    const newProps = {
      page: Number(prevProps.page),
      pageSize: Number(prevProps.pageSize),
      order: prevProps.order,
      search: prevProps.search,
      searchField: prevProps.searchField,
      rank_id: prevProps.rank_id,
    };

    // Ensure order is of type "asc" | "desc" | undefined
    if (
      newProps.order &&
      newProps.order !== "asc" &&
      newProps.order !== "desc"
    ) {
      newProps.order = "desc"; // Default to desc if invalid value
    }

    setPagination(newProps as RanksReadProps);
  };

  const router = useRouter();

  const columns: CustomColumDef<trade_rank>[] = setDefaultColumn([
    {
      accessorKey: "rank_level",
      headerTitle: "랭크",
    },
    {
      accessorKey: "name",
      headerTitle: "이름",
    },
    {
      accessorKey: "min_trade_count",
      headerTitle: "최소 거래 횟수",
    },
    {
      accessorKey: "description",
      headerTitle: "설명",
    },
    {
      accessorKey: "badge_image",
      headerTitle: "배지 이미지",
    },
    {
      accessorKey: "is_active",
      headerTitle: "활성화",
    },
    {
      accessorKey: "created_at",
      headerTitle: "생성일",
      cell: (props) => {
        const date = new Date(props.getValue());
        return date.toLocaleString("ko-KR", {
          year: "2-digit",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
      },
    },
    {
      accessorKey: "updated_at",
      headerTitle: "수정일",
      cell: (props) => {
        const date = new Date(props.getValue());
        return date.toLocaleString("ko-KR", {
          year: "2-digit",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
      },
    },
    {
      accessorKey: "control",
      headerTitle: "수정",
      cell: (props) => {
        return (
          <div className="flex justify-center gap-2">
            <Button
              type="button"
              className="!p-2 !h-fit"
              onClick={() =>
                router.push(
                  `${AdminAppRoute.Ranks}/${ranksData?.ranks[props.row.index].id}`
                )
              }
            >
              수정
            </Button>
            <ConfirmDialog
              title="랭크 삭제"
              description="랭크를 삭제하시려면 확인을 눌러주세요."
              onConfirm={() => deleteRank(props.row.index)}
            >
              <Button type="button" className="!p-2 !h-fit" variant="outline">
                삭제
              </Button>
            </ConfirmDialog>
          </div>
        );
      },
    },
  ]);

  const methods = useForm<AdminRanksMethods>({
    defaultValues: {
      page: "1",
      pageSize: "10",
      order: "desc",
      search: "",
      searchField: "name",
      rank_id: undefined,
    },
    reValidateMode: "onSubmit",
  });

  const { toast } = useToast();

  const { setLoading, disableLoading, queryClient } = useLoadingHandler();

  const deleteRank = async (index: number) => {
    if (!ranksData) return;
    setLoading();
    try {
      const { isSuccess, hasMessage } = await postJson<RanksDeleteProps>(
        ApiRoute.adminRanksDelete,
        { deleteRankId: ranksData.ranks[index].id }
      );
      if (hasMessage) {
        toast({ id: hasMessage, type: isSuccess ? "success" : "error" });
      }
      if (isSuccess) refreshCache(queryClient, QueryKey.ranks);
    } catch (error) {
      toast({
        id: ToastData.unknown,
        type: "error",
      });
    }
    disableLoading();
  };

  const newCreateRank = () => {
    router.push(`${AdminAppRoute.Ranks}/create`);
  };

  const autoCreateRank = () => {
    router.push(`${AdminAppRoute.Ranks}/auto`);
  };

  const resetSearch = () => {
    methods.reset({
      page: "1",
      pageSize: "10",
      order: "desc",
      search: "",
      searchField: "name",
      rank_id: undefined,
    });
    updatePagination();
  };

  return {
    columns,
    methods,
    updatePagination,
    ranksData,
    newCreateRank,
    autoCreateRank,
    deleteRank,
    resetSearch,
  };
};

interface RanksBatchEditForm {
  rangeStart: number;
  rangeEnd: number;
  name?: string;
  badgeImageUrl?: string;
  description?: string;
}

interface RanksBatchEditRequest {
  rangeStart: number;
  rangeEnd: number;
  updates: {
    name?: string;
    badge_image?: string;
    description?: string;
  };
}

export const useAdminRanksBatchEditHook = (onSuccess?: () => void) => {
  const { toast } = useToast();
  const { setLoading, disableLoading, queryClient } = useLoadingHandler();
  const [isLoading, setIsLoading] = useState(false);

  const methods = useForm<RanksBatchEditForm>({
    defaultValues: {
      rangeStart: 1,
      rangeEnd: 2,
      name: "",
      badgeImageUrl: "",
      description: "",
    },
  });

  const onSubmit = async (data: RanksBatchEditForm) => {
    if (data.rangeStart > data.rangeEnd) {
      toast({
        id: ToastData.unknown,
        type: "error",
      });
      return;
    }

    setIsLoading(true);
    setLoading();

    try {
      const request: RanksBatchEditRequest = {
        rangeStart: data.rangeStart,
        rangeEnd: data.rangeEnd,
        updates: {
          name: data.name || undefined,
          badge_image: data.badgeImageUrl || undefined,
          description: data.description || undefined,
        },
      };

      const { isSuccess, hasMessage } = await postJson(
        ApiRoute.adminRanksBatchEdit,
        request
      );

      if (hasMessage) {
        toast({
          id: hasMessage,
          type: isSuccess ? "success" : "error",
        });
      }

      if (isSuccess) {
        refreshCache(queryClient, QueryKey.ranks);
        onSuccess?.();
      }
    } catch (error) {
      toast({
        id: ToastData.rankBatchEdit,
        type: "error",
      });
    } finally {
      setIsLoading(false);
      disableLoading();
    }
  };

  return {
    methods,
    onSubmit,
    isLoading,
  };
};
