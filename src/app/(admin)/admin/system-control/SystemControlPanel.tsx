"use client";

import { useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  Ban,
  CircleStop,
  PauseCircle,
  PlayCircle,
  Trash2,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { ApiRoute, QueryKey } from "@/helpers/types";
import { ToastData } from "@/helpers/toastData";
import { postJson, refreshCache } from "@/helpers/common";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import { useQueryClient } from "@tanstack/react-query";
import { adminGeneralGet } from "@/helpers/get";

const CANCEL_PHRASE = "모든 거래 취소";
const RESET_PHRASE = "거래 기록 리셋";

type GeneralSettings = {
  id: number;
  p2p_paused?: boolean;
  [key: string]: any;
};

export const SystemControlPanel = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isWorking, setIsWorking] = useState(false);

  const { data: generalData } = useGetQuery<GeneralSettings, {}>(
    {
      queryKey: [QueryKey.generalSettings],
    },
    adminGeneralGet,
    undefined,
    { silent: true }
  );

  const paused = Boolean(generalData?.p2p_paused);

  // ─── Modal state ────────────────────────────────────────────────────
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelPhrase, setCancelPhrase] = useState("");

  const [resetOpen, setResetOpen] = useState(false);
  const [resetPhrase, setResetPhrase] = useState("");

  const [pauseOpen, setPauseOpen] = useState(false);
  const [pendingPaused, setPendingPaused] = useState<boolean | null>(null);

  // ─── Handlers ───────────────────────────────────────────────────────
  const runCancelAll = async () => {
    setCancelOpen(false);
    setCancelPhrase("");
    setIsWorking(true);
    try {
      const { isSuccess, hasMessage } = await postJson(
        ApiRoute.adminSystemCancelActiveTethers,
        {}
      );
      toast({
        id: isSuccess
          ? ToastData.systemTetherCancelAllSuccess
          : hasMessage || ToastData.systemTetherCancelAllFailed,
        type: isSuccess ? "success" : "error",
      });
    } catch {
      toast({ id: ToastData.systemTetherCancelAllFailed, type: "error" });
    }
    setIsWorking(false);
  };

  const runReset = async () => {
    setResetOpen(false);
    setResetPhrase("");
    setIsWorking(true);
    try {
      const { isSuccess, hasMessage } = await postJson(
        ApiRoute.adminSystemResetTradeRecords,
        {}
      );
      toast({
        id: isSuccess
          ? ToastData.systemTradeResetSuccess
          : hasMessage || ToastData.systemTradeResetFailed,
        type: isSuccess ? "success" : "error",
      });
      if (isSuccess) {
        refreshCache(queryClient, QueryKey.leaderboard);
      }
    } catch {
      toast({ id: ToastData.systemTradeResetFailed, type: "error" });
    }
    setIsWorking(false);
  };

  const runPauseUpdate = async () => {
    if (pendingPaused === null) return;
    const next = pendingPaused;
    setPauseOpen(false);
    setPendingPaused(null);
    setIsWorking(true);
    try {
      const { isSuccess, hasMessage } = await postJson(
        ApiRoute.adminSystemP2pPause,
        { paused: next }
      );
      toast({
        id: isSuccess
          ? ToastData.systemP2pPauseUpdateSuccess
          : hasMessage || ToastData.systemP2pPauseUpdateFailed,
        type: isSuccess ? "success" : "error",
      });
      if (isSuccess) {
        refreshCache(queryClient, QueryKey.generalSettings);
      }
    } catch {
      toast({ id: ToastData.systemP2pPauseUpdateFailed, type: "error" });
    }
    setIsWorking(false);
  };

  // ─── UI ─────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">
      {/* Pause toggle ─────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <PauseCircle className="w-5 h-5 text-amber-500" />
            <h3>거래 게시 일시 중단</h3>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            새로운 P2P 거래 게시물 등록을 일시적으로 차단합니다. 이미 진행 중인
            거래(제안, 평가)는 정상적으로 마무리할 수 있습니다.
          </p>
          <div className="rounded-md border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20 p-3 text-sm flex gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 text-amber-600 shrink-0" />
            <div>
              <p className="font-medium text-amber-700 dark:text-amber-400">
                긴급 시나리오용 토글
              </p>
              <p className="text-amber-700/80 dark:text-amber-400/80">
                활성화 시 사용자에게는 토스트 안내가 표시되며, 거래 등록 API가
                즉시 차단됩니다.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <div className="flex items-center gap-2">
              {paused ? (
                <PauseCircle className="w-5 h-5 text-amber-500" />
              ) : (
                <PlayCircle className="w-5 h-5 text-success" />
              )}
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  현재 상태: {paused ? "일시 중단" : "정상 운영"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {paused
                    ? "거래 게시가 차단되어 있습니다."
                    : "사용자가 거래를 자유롭게 등록할 수 있습니다."}
                </span>
              </div>
            </div>
            <Switch
              checked={paused}
              onCheckedChange={(checked) => {
                setPendingPaused(checked);
                setPauseOpen(true);
              }}
              aria-label="거래 게시 일시 중단 토글"
            />
          </div>
        </CardContent>
      </Card>

      {/* Cancel all active tethers ─────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CircleStop className="w-5 h-5 text-fail" />
            <h3>모든 거래 취소</h3>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            현재 진행 중(open / progress)인 모든 P2P 거래 게시물의 상태를
            <span className="font-medium"> 취소</span>로 변경합니다. 해당
            게시물들의 진행 중인 제안도 함께 취소되며, 작성자의{" "}
            <code className="text-xs">trade_total</code> 값이 차감됩니다.
          </p>
          <div className="rounded-md border border-fail/30 bg-fail/5 p-3 text-sm flex gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 text-fail shrink-0" />
            <div>
              <p className="font-medium text-fail">되돌릴 수 없는 작업</p>
              <p className="text-foreground/80">
                완료된(complete) 거래에는 영향을 주지 않습니다. 평가 진행 중인
                거래(complete 상태)는 보존됩니다.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="destructive"
            onClick={() => setCancelOpen(true)}
          >
            <Ban className="w-4 h-4 mr-2" />
            모든 거래 취소
          </Button>
        </CardContent>
      </Card>

      {/* Full reset ────────────────────────────────────────── */}
      <Card className="border-fail/40">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-fail" />
            <h3>거래 기록 리셋</h3>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            P2P 거래 시스템을 완전히 초기 상태로 되돌립니다. 다음 데이터가 모두
            삭제 또는 초기화됩니다:
          </p>
          <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
            <li>모든 거래 게시물 (tether)</li>
            <li>모든 거래 제안 (tether_proposal)</li>
            <li>모든 거래 평가 (tether_rate)</li>
            <li>
              모든 사용자의 trade_total / trade_count / trade_joined /
              trade_rate
            </li>
            <li>모든 사용자의 등급(rank) — 최저 등급으로 초기화</li>
            <li>전체 / 주간 / 일간 랭킹 — 초기화</li>
          </ul>
          <div className="rounded-md border border-fail/40 bg-fail/10 p-3 text-sm flex gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 text-fail shrink-0" />
            <div>
              <p className="font-medium text-fail">매우 위험한 작업입니다</p>
              <p className="text-foreground/80">
                삭제된 데이터는{" "}
                <span className="font-medium">복구할 수 없습니다</span>.
                일반적으로 운영 중단 또는 시스템 초기화 시점에만 사용해주세요.
                먼저 ‘모든 거래 취소’를 실행한 뒤 진행하는 것을 권장합니다.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="destructive"
            onClick={() => setResetOpen(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            거래 기록 리셋
          </Button>
        </CardContent>
      </Card>

      {/* ─── Cancel-all confirm modal ─────────────────────── */}
      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-fail" />
              모든 진행 중인 거래를 취소하시겠습니까?
            </AlertDialogTitle>
            <AlertDialogDescription>
              현재 open 또는 progress 상태인 모든 거래 게시물과 그에 속한 진행
              중인 제안이 즉시 취소됩니다. 이 작업은{" "}
              <span className="font-semibold text-fail">
                되돌릴 수 없습니다
              </span>
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <p className="text-sm">
              계속 진행하려면 아래에{" "}
              <code className="px-1 py-0.5 rounded bg-muted">
                {CANCEL_PHRASE}
              </code>{" "}
              를 입력하세요.
            </p>
            <Input
              value={cancelPhrase}
              onChange={(e) => setCancelPhrase(e.target.value)}
              placeholder={CANCEL_PHRASE}
              autoFocus
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCancelPhrase("")}>
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={cancelPhrase !== CANCEL_PHRASE}
              onClick={runCancelAll}
              className="bg-fail hover:bg-fail/90 text-primary-foreground"
            >
              실행
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Reset confirm modal ──────────────────────────── */}
      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-fail" />
              모든 거래 기록을 삭제하시겠습니까?
            </AlertDialogTitle>
            <AlertDialogDescription>
              모든 거래 게시물, 제안, 평가, 사용자 거래 카운터, 등급, 랭킹이
              초기화됩니다. 삭제된 데이터는{" "}
              <span className="font-semibold text-fail">
                복구할 수 없습니다
              </span>
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <p className="text-sm">
              계속 진행하려면 아래에{" "}
              <code className="px-1 py-0.5 rounded bg-muted">
                {RESET_PHRASE}
              </code>{" "}
              를 입력하세요.
            </p>
            <Input
              value={resetPhrase}
              onChange={(e) => setResetPhrase(e.target.value)}
              placeholder={RESET_PHRASE}
              autoFocus
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setResetPhrase("")}>
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={resetPhrase !== RESET_PHRASE}
              onClick={runReset}
              className="bg-fail hover:bg-fail/90 text-primary-foreground"
            >
              완전히 초기화
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Pause toggle confirm modal ───────────────────── */}
      <AlertDialog
        open={pauseOpen}
        onOpenChange={(open) => {
          setPauseOpen(open);
          if (!open) setPendingPaused(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {pendingPaused ? (
                <PauseCircle className="w-5 h-5 text-amber-500" />
              ) : (
                <PlayCircle className="w-5 h-5 text-success" />
              )}
              {pendingPaused
                ? "거래 게시를 일시 중단하시겠습니까?"
                : "거래 게시를 재개하시겠습니까?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingPaused
                ? "활성화하면 즉시 모든 사용자의 신규 거래 등록이 차단됩니다. 진행 중인 거래는 영향을 받지 않습니다."
                : "비활성화하면 사용자가 다시 거래를 등록할 수 있습니다."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={runPauseUpdate}
              className={
                pendingPaused
                  ? "bg-amber-500 hover:bg-amber-500/90 text-primary-foreground"
                  : "bg-success hover:bg-success/90 text-primary-foreground"
              }
            >
              {pendingPaused ? "일시 중단" : "재개"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
