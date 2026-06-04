"use client";

import type { board_rank } from "@prisma/client";
import type { BoardRanksDeleteProps } from "@/app/api/admin_di2u3k2j/board_ranks/delete";
import type {
  BoardRanksListResponse,
  BoardRanksReadProps,
} from "@/app/api/admin_di2u3k2j/board_ranks/read";
import ConfirmDialog from "@/components/1_atoms/ConfirmDialog";
import type { CustomColumDef } from "@/components/2_molecules/Table/DataTable";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { postJson, refreshCache } from "@/helpers/common";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import { useQueryClient } from "@tanstack/react-query";
import { adminBoardRanksGet } from "@/helpers/get";
import { setDefaultColumn } from "@/helpers/makeComponent";
import { ToastData } from "@/helpers/toastData";
import { AdminAppRoute, ApiRoute, QueryKey } from "@/helpers/types";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

export interface AdminBoardRanksMethods {
  page: string;
  pageSize: string;
  order: string;
  search: string;
  searchField: "name" | "rank_level" | "description";
  rank_id?: number;
}

export const useAdminBoardRanksHook = () => {
  const [pagination, setPagination] = useState<BoardRanksReadProps>({
    page: 1,
    pageSize: 10,
  });

  const { data: ranksData } = useGetQuery<
    BoardRanksListResponse,
    BoardRanksReadProps
  >(
    {
      queryKey: [{ [QueryKey.boardRanks]: pagination }],
    },
    adminBoardRanksGet,
    pagination,
    { silent: true }
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

    setPagination(newProps as BoardRanksReadProps);
  };

  const router = useRouter();
  const [editRankId, setEditRankId] = useState<number | null>(null);

  const columns: CustomColumDef<board_rank>[] = setDefaultColumn([
    {
      accessorKey: "rank_level",
      headerTitle: "등급",
    },
    {
      accessorKey: "name",
      headerTitle: "이름",
    },
    {
      accessorKey: "min_point",
      headerTitle: "최소 포인트",
    },
    {
      accessorKey: "description",
      headerTitle: "설명",
    },
    {
      accessorKey: "badge_image",
      headerTitle: "배지 이미지",
      cell: (props) => {
        const url = props.getValue() as string | null;
        if (!url) return <span className="text-muted-foreground">-</span>;
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt="badge"
            className="w-8 h-8 rounded object-contain"
          />
        );
      },
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
                setEditRankId(ranksData?.ranks[props.row.index].id ?? null)
              }
            >
              수정
            </Button>
            <ConfirmDialog
              title="등급 삭제"
              description="등급를 삭제하시려면 확인을 눌러주세요."
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

  const methods = useForm<AdminBoardRanksMethods>({
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

  const queryClient = useQueryClient();
  const [isWorking, setIsWorking] = useState(false);

  const deleteRank = async (index: number) => {
    if (!ranksData) return;
    if (isWorking) return;
    setIsWorking(true);
    try {
      const { isSuccess, hasMessage } = await postJson<BoardRanksDeleteProps>(
        ApiRoute.adminBoardRanksDelete,
        { deleteRankId: ranksData.ranks[index].id }
      );
      if (hasMessage) {
        toast({ id: hasMessage, type: isSuccess ? "success" : "error" });
      }
      if (isSuccess) refreshCache(queryClient, QueryKey.boardRanks);
    } catch (error) {
      toast({
        id: ToastData.unknown,
        type: "error",
      });
    }
    setIsWorking(false);
  };

  const autoCreateRank = () => {
    router.push(`${AdminAppRoute.BoardRanks}/auto`);
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
    autoCreateRank,
    deleteRank,
    resetSearch,
    editRankId,
    setEditRankId,
  };
};
