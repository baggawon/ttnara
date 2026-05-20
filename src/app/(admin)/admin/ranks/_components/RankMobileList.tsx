"use client";

import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import type { trade_rank } from "@prisma/client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ConfirmDialog from "@/components/1_atoms/ConfirmDialog";
import { AdminAppRoute, type PaginationInfo } from "@/helpers/types";

dayjs.extend(utc);
dayjs.extend(timezone);

interface Props {
  ranks?: trade_rank[];
  pagination?: PaginationInfo;
  onPageChange: (index: number) => void;
  onDelete: (index: number) => void;
}

export function RankMobileList({
  ranks,
  pagination,
  onPageChange,
  onDelete,
}: Props) {
  const router = useRouter();
  const list = ranks ?? [];

  return (
    <div className="flex flex-col gap-2 lg:hidden">
      {list.map((rank, idx) => (
        <Card key={rank.id}>
          <CardContent className="p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex items-center gap-2">
                {rank.badge_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={rank.badge_image}
                    alt=""
                    className="w-8 h-8 rounded shrink-0 object-contain"
                  />
                ) : (
                  <div className="w-8 h-8 rounded shrink-0 bg-muted flex items-center justify-center text-[10px] text-muted-foreground">
                    {rank.rank_level}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="font-semibold truncate">
                    Lv. {rank.rank_level}
                    {rank.name ? ` · ${rank.name}` : ""}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    최소 거래 {rank.min_trade_count}회
                  </div>
                </div>
              </div>
              {rank.is_active ? (
                <Badge variant="default" className="shrink-0">
                  활성
                </Badge>
              ) : (
                <Badge variant="secondary" className="shrink-0">
                  비활성
                </Badge>
              )}
            </div>

            {rank.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 [overflow-wrap:anywhere]">
                {rank.description}
              </p>
            )}

            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              <Row k="생성일">{formatDate(rank.created_at)}</Row>
              <Row k="수정일">{formatDate(rank.updated_at)}</Row>
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                size="sm"
                className="flex-1"
                onClick={() => router.push(`${AdminAppRoute.Ranks}/${rank.id}`)}
              >
                수정
              </Button>
              <ConfirmDialog
                title="등급 삭제"
                description="등급를 삭제하시려면 확인을 눌러주세요."
                onConfirm={() => onDelete(idx)}
              >
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="flex-1"
                >
                  삭제
                </Button>
              </ConfirmDialog>
            </div>
          </CardContent>
        </Card>
      ))}

      {list.length === 0 && (
        <div className="text-center py-8 text-sm text-muted-foreground">
          등록된 등급가 없습니다.
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 text-xs">
          <span className="text-muted-foreground">
            총 {pagination.totalItems}개
          </span>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!pagination.hasPreviousPage}
              onClick={() => onPageChange(pagination.currentPage - 1)}
            >
              이전
            </Button>
            <span className="px-2 py-1">
              {pagination.currentPage} / {pagination.totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!pagination.hasNextPage}
              onClick={() => onPageChange(pagination.currentPage + 1)}
            >
              다음
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-1 min-w-0">
      <dt className="text-muted-foreground shrink-0">{k}</dt>
      <dd className="truncate">{children}</dd>
    </div>
  );
}

function formatDate(d: Date | string) {
  return dayjs(d).tz("Asia/Seoul").format("YY-MM-DD HH:mm");
}
