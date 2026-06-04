"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ConfirmDialog from "@/components/1_atoms/ConfirmDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import { useQueryClient } from "@tanstack/react-query";
import { adminRankBadgesGet } from "@/helpers/get";
import { postFormData, postJson } from "@/helpers/common";
import { AdminAppRoute, ApiRoute, QueryKey } from "@/helpers/types";
import { ToastData } from "@/helpers/toastData";
import { ArrowLeft, Trash2, Upload, ImagePlus } from "lucide-react";
import type {
  RankBadgeListItem,
  RankBadgeListResponse,
} from "@/app/api/admin_di2u3k2j/rank_badges/list";
import type {
  RankBadgeAssignProps,
  RankBadgeAssignResponseData,
} from "@/app/api/admin_di2u3k2j/rank_badges/assign";
import type { RankBadgeUnassignProps } from "@/app/api/admin_di2u3k2j/rank_badges/unassign";
import type { RankBadgeDeleteProps } from "@/app/api/admin_di2u3k2j/rank_badges/delete";
import type { RankBadgeUploadResult } from "@/app/api/admin_di2u3k2j/rank_badges/upload";
import Image from "next/image";

export default function RankBadgesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isWorking, setIsWorking] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadName, setUploadName] = useState("");
  const [assignTarget, setAssignTarget] = useState<RankBadgeListItem | null>(
    null
  );
  const [rangeStart, setRangeStart] = useState("1");
  const [rangeEnd, setRangeEnd] = useState("1");

  const { data } = useGetQuery<RankBadgeListResponse | null, undefined>(
    { queryKey: [QueryKey.rankBadges] },
    adminRankBadgesGet,
    undefined,
    { silent: true }
  );
  const badges = data?.badges ?? [];

  const refresh = async () => {
    await Promise.all([
      queryClient.refetchQueries({
        queryKey: [QueryKey.rankBadges],
        type: "active",
      }),
      queryClient.refetchQueries({
        queryKey: [QueryKey.ranks],
        type: "active",
      }),
    ]);
  };

  const onPickFile = () => fileInputRef.current?.click();

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const fd = new FormData();
    fd.append("file", file);
    if (uploadName.trim()) fd.append("name", uploadName.trim());

    setIsWorking(true);
    try {
      const { isSuccess, hasMessage, hasData } = await postFormData(
        ApiRoute.adminRankBadgesUpload,
        fd
      );
      if (!isSuccess) {
        toast({
          id: hasMessage ?? ToastData.rankBadgeUpload,
          type: "error",
        });
        return;
      }
      const payload = hasData as RankBadgeUploadResult | false;
      if (payload && payload.ok === false) {
        toast({
          id: ToastData.rankBadgeAssignConflict,
          type: "error",
          value: payload.description,
        });
        return;
      }
      toast({ id: ToastData.rankBadgeUpload, type: "success" });
      setUploadName("");
      await refresh();
    } finally {
      setIsWorking(false);
    }
  };

  const openAssign = (badge: RankBadgeListItem) => {
    setAssignTarget(badge);
    setRangeStart(String(badge.assigned_min_rank ?? 1));
    setRangeEnd(
      String(badge.assigned_max_rank ?? badge.assigned_min_rank ?? 1)
    );
  };

  const submitAssign = async () => {
    if (!assignTarget) return;
    const start = Number(rangeStart);
    const end = Number(rangeEnd);
    if (
      !Number.isFinite(start) ||
      !Number.isFinite(end) ||
      start > end ||
      start < 1
    ) {
      toast({ id: ToastData.rankBadgeRangeInvalid, type: "error" });
      return;
    }
    setIsWorking(true);
    try {
      const { isSuccess, hasMessage, hasData } =
        await postJson<RankBadgeAssignProps>(ApiRoute.adminRankBadgesAssign, {
          id: assignTarget.id,
          rangeStart: start,
          rangeEnd: end,
        });
      const payload = hasData as RankBadgeAssignResponseData | false;
      if (!isSuccess) {
        toast({
          id: hasMessage ?? ToastData.rankBadgeAssign,
          type: "error",
        });
        return;
      }
      if (payload && payload.ok === false) {
        toast({
          id: ToastData.rankBadgeAssignConflict,
          type: "error",
          value: payload.description,
        });
        return;
      }
      toast({ id: ToastData.rankBadgeAssign, type: "success" });
      setAssignTarget(null);
      await refresh();
    } finally {
      setIsWorking(false);
    }
  };

  const unassign = async (badge: RankBadgeListItem) => {
    setIsWorking(true);
    try {
      const { isSuccess, hasMessage } = await postJson<RankBadgeUnassignProps>(
        ApiRoute.adminRankBadgesUnassign,
        { id: badge.id }
      );
      toast({
        id: hasMessage ?? ToastData.rankBadgeUnassign,
        type: isSuccess ? "success" : "error",
      });
      if (isSuccess) await refresh();
    } finally {
      setIsWorking(false);
    }
  };

  const removeBadge = async (badge: RankBadgeListItem) => {
    setIsWorking(true);
    try {
      const { isSuccess, hasMessage } = await postJson<RankBadgeDeleteProps>(
        ApiRoute.adminRankBadgesDelete,
        { id: badge.id }
      );
      toast({
        id: hasMessage ?? ToastData.rankBadgeDelete,
        type: isSuccess ? "success" : "error",
      });
      if (isSuccess) await refresh();
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <section className="w-full flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-2xl font-bold tracking-tight">배지 이미지 관리</h2>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(AdminAppRoute.Ranks)}
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          거래 등급 관리로
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <ImagePlus className="w-4 h-4" />새 배지 업로드
          </CardTitle>
          <CardDescription>
            PNG / JPG / WebP / SVG, 최대 2MB. 업로드 후 등급 범위를
            할당해주세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-2">
          <Input
            placeholder="이름 (선택)"
            value={uploadName}
            onChange={(e) => setUploadName(e.target.value)}
            className="w-full sm:max-w-xs"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
            onChange={onFileSelected}
          />
          <Button
            type="button"
            onClick={onPickFile}
            className="w-full sm:w-auto"
          >
            <Upload className="w-4 h-4 mr-1" />
            파일 선택
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">업로드된 배지</CardTitle>
          <CardDescription>
            등급 범위에 할당하거나 할당을 해제할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {badges.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-muted-foreground">
              업로드된 배지가 없습니다.
            </div>
          ) : (
            <ul className="divide-y">
              {badges.map((b) => (
                <li
                  key={b.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3 sm:px-6"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-12 h-12 shrink-0 rounded border bg-muted/30 flex items-center justify-center overflow-hidden">
                      {b.url ? (
                        <Image
                          src={b.url}
                          alt={b.name ?? `badge-${b.id}`}
                          width={48}
                          height={48}
                          className="w-12 h-12 object-contain"
                          unoptimized
                        />
                      ) : null}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {b.name ?? `배지 #${b.id}`}
                      </div>
                      <div className="text-xs text-muted-foreground tabular-nums">
                        {b.assigned_min_rank !== null &&
                        b.assigned_max_rank !== null
                          ? b.assigned_min_rank === b.assigned_max_rank
                            ? `등급 ${b.assigned_min_rank} 할당됨`
                            : `등급 ${b.assigned_min_rank}–${b.assigned_max_rank} 할당됨`
                          : "미할당"}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => openAssign(b)}
                    >
                      {b.assigned_min_rank !== null ? "범위 수정" : "범위 할당"}
                    </Button>
                    {b.assigned_min_rank !== null && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => unassign(b)}
                      >
                        해제
                      </Button>
                    )}
                    <ConfirmDialog
                      title="배지 삭제"
                      description="삭제 시 할당된 등급의 배지도 함께 해제됩니다."
                      onConfirm={() => removeBadge(b)}
                    >
                      <Button type="button" size="sm" variant="destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </ConfirmDialog>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={assignTarget !== null}
        onOpenChange={(o) => !o && setAssignTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>등급 범위 할당</DialogTitle>
            <DialogDescription>
              {assignTarget?.name ?? `배지 #${assignTarget?.id ?? ""}`} 을(를)
              할당할 등급 범위를 입력해주세요. 범위 내 다른 배지가 이미 할당되어
              있으면 작업이 거부됩니다.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">시작 등급</label>
              <Input
                type="number"
                min={1}
                value={rangeStart}
                onChange={(e) => setRangeStart(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">끝 등급</label>
              <Input
                type="number"
                min={1}
                value={rangeEnd}
                onChange={(e) => setRangeEnd(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAssignTarget(null)}
            >
              취소
            </Button>
            <Button
              type="button"
              onClick={submitAssign}
              disabled={isWorking}
              aria-busy={isWorking}
            >
              할당
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
