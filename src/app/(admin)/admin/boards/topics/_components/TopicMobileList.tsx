"use client";

import { useRouter } from "next/navigation";
import type { TopicWithPoint } from "@/app/api/admin_di2u3k2j/topics/read";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ConfirmDialog from "@/components/1_atoms/ConfirmDialog";
import { AdminAppRoute, type PaginationInfo } from "@/helpers/types";

interface Props {
  topics?: TopicWithPoint[];
  pagination?: PaginationInfo;
  onPageChange: (index: number) => void;
  onTogglePreview: (index: number) => void;
  onDelete: (index: number) => void;
}

export function TopicMobileList({
  topics,
  pagination,
  onPageChange,
  onTogglePreview,
  onDelete,
}: Props) {
  const router = useRouter();
  const list = topics ?? [];

  return (
    <div className="flex flex-col gap-2 lg:hidden">
      {list.map((topic, idx) => (
        <Card key={topic.id}>
          <CardContent className="p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="font-semibold truncate">{topic.name}</div>
                <div className="text-xs text-muted-foreground truncate font-mono">
                  /{topic.url}
                </div>
              </div>
              <div className="flex flex-wrap gap-1 justify-end shrink-0">
                {topic.is_active ? (
                  <Badge variant="default">활성</Badge>
                ) : (
                  <Badge variant="secondary">비활성</Badge>
                )}
                {topic.preview_on_homepage && (
                  <Badge variant="outline">홈 노출</Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              <Row k="순서">{topic.display_order}</Row>
              <Row k="ID">{topic.id}</Row>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <Button
                type="button"
                size="sm"
                variant={topic.preview_on_homepage ? "default" : "outline"}
                disabled={!topic.is_active}
                onClick={() => onTogglePreview(idx)}
              >
                홈 미리보기 {topic.preview_on_homepage ? "ON" : "OFF"}
              </Button>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() =>
                    router.push(`${AdminAppRoute.Boards}/${topic.id}`)
                  }
                >
                  수정
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    router.push(
                      `${AdminAppRoute.Boards}/${topic.id}/categories`
                    )
                  }
                >
                  카테고리
                </Button>
                <ConfirmDialog
                  title="게시판 삭제"
                  description="게시판을 삭제하시려면 확인을 눌러주세요."
                  onConfirm={() => onDelete(idx)}
                >
                  <Button type="button" size="sm" variant="outline">
                    삭제
                  </Button>
                </ConfirmDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {list.length === 0 && (
        <div className="text-center py-8 text-sm text-muted-foreground">
          등록된 게시판이 없습니다.
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
