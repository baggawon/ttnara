"use client";

import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdminAppRoute, type PaginationInfo } from "@/helpers/types";
import type { UserForAdmin } from "@/app/api/admin_di2u3k2j/users/read";

dayjs.extend(utc);
dayjs.extend(timezone);

interface Props {
  users?: UserForAdmin[];
  pagination?: PaginationInfo;
  onPageChange: (index: number) => void;
}

const kycLabel = (kyc_id: string | null | undefined) => {
  if (kyc_id === null || kyc_id === undefined) return "미등록";
  const n = Number(kyc_id);
  if (Number.isNaN(n)) return "미등록";
  if (n === 0) return "시뮬레이션";
  if (n > 0) return "인증완료";
  return "미등록";
};

export function UserMobileList({ users, pagination, onPageChange }: Props) {
  const router = useRouter();
  const list = users ?? [];

  return (
    <div className="flex flex-col gap-2 lg:hidden">
      {list.map((user) => {
        const isAdmin = !!user.profile?.is_app_admin;
        const isActive = user.is_active;
        const hasWarranty = !!user.profile?.has_warranty;

        return (
          <Card key={user.id}>
            <CardContent className="p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold truncate">
                    {user.profile?.displayname || user.username}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    @{user.username}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 justify-end shrink-0">
                  {isAdmin && <Badge variant="default">관리자</Badge>}
                  {!isActive && <Badge variant="destructive">비활성</Badge>}
                  {hasWarranty && <Badge variant="secondary">보증</Badge>}
                </div>
              </div>

              <div className="text-xs text-muted-foreground truncate">
                {user.profile?.email || "-"}
              </div>

              <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                <Row k="가입일">
                  {dayjs(user.created_at).tz("Asia/Seoul").format("YYYY-MM-DD")}
                </Row>
                <Row k="KYC">{kycLabel(user.profile?.kyc_id)}</Row>
                <Row k="거래 등급">
                  {user.profile?.current_rank_level ?? "-"}
                </Row>
                <Row k="게시판 등급">
                  {user.profile?.current_board_rank_level ?? "-"}
                </Row>
                <Row k="권한 레벨">{user.profile?.auth_level ?? "-"}</Row>
                {hasWarranty && (
                  <Row k="보증금">
                    {(
                      user.profile?.warranty_deposit_amount ?? 0
                    ).toLocaleString()}
                  </Row>
                )}
              </dl>

              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  size="sm"
                  className="flex-1"
                  onClick={() =>
                    router.push(`${AdminAppRoute.Users}/${user.id}`)
                  }
                >
                  보기
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() =>
                    router.push(`${AdminAppRoute.Users}/${user.id}/edit`)
                  }
                >
                  수정
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {list.length === 0 && (
        <div className="text-center py-8 text-sm text-muted-foreground">
          사용자가 없습니다.
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 text-xs">
          <span className="text-muted-foreground">
            총 {pagination.totalItems}명
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
