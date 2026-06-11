"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RankBadge } from "@/components/1_atoms/rank/RankBadge";
import useGetQuery from "@/helpers/customHook/useGetQuery";
import { leaderboardUserGet, userGet } from "@/helpers/get";
import { QueryKey, type UserAndSettings } from "@/helpers/types";
import type { UserRankingResponse } from "@/app/api/leaderboard/user";
import { useTetherEnabled } from "@/helpers/customHook/useTetherEnabled";
import { useDisplaySettings } from "@/helpers/customHook/useDisplaySettings";
import { isCuid } from "@paralleldrive/cuid2";
import { ShieldCheck, ShieldAlert, Mail, MailCheck } from "lucide-react";
import { cn } from "@/components/lib/utils";

const ProfileHero = () => {
  const tetherEnabled = useTetherEnabled();
  const { showTradeRank, showBoardRank } = useDisplaySettings();
  const { data: userData } = useGetQuery<UserAndSettings, undefined>(
    { queryKey: [QueryKey.account] },
    userGet,
    undefined,
    { silent: true }
  );

  const tradeRankVisible = tetherEnabled && showTradeRank;

  const { data: rankingData } = useGetQuery<UserRankingResponse, undefined>(
    {
      queryKey: [QueryKey.leaderboardUser],
      enabled: tradeRankVisible,
      staleTime: 60000,
    },
    leaderboardUserGet,
    undefined,
    { silent: true }
  );

  const profile = userData?.profile;
  const username = userData?.username ?? "";
  const rawDisplayname = profile?.displayname ?? "";
  const isPlaceholderName =
    !!rawDisplayname && isCuid(rawDisplayname) && rawDisplayname.length === 24;
  const displayname = isPlaceholderName ? username : rawDisplayname;

  const point = profile?.point ?? 0;
  const rankingTotal = rankingData?.total?.ranking_point ?? 0;
  const boardRankImage = profile?.current_board_rank_image;
  const boardRankName = profile?.current_board_rank_name;
  const kycVerified = !!profile?.kyc_id;
  const emailVerified = !!profile?.email_is_validated;

  return (
    <Card className="overflow-hidden border-none shadow-md">
      <div className="bg-gradient-to-br from-emerald-500/10 via-primary/5 to-amber-400/10 dark:from-emerald-500/15 dark:via-primary/10 dark:to-amber-400/15">
        <div className="flex flex-col gap-4 p-4 sm:p-6 sm:flex-row sm:items-center">
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex flex-col gap-0.5">
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight truncate">
                {displayname || "사용자"}
              </h3>
              <p className="text-sm text-muted-foreground truncate">
                @{username}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {tradeRankVisible && (
                <Badge
                  variant="outline"
                  className="gap-1 bg-background/60 backdrop-blur"
                >
                  <RankBadge
                    badgeName={profile?.current_rank_image ?? "bronze.png"}
                    className="!w-3.5 !h-3.5"
                  />
                  <span>{profile?.current_rank_name ?? "브론즈"}</span>
                </Badge>
              )}
              {tradeRankVisible && (
                <Badge
                  variant="outline"
                  className="gap-1 bg-background/60 backdrop-blur text-blue-700 dark:text-blue-400"
                >
                  <span className="font-bold">R</span>
                  <span className="tabular-nums">
                    {rankingTotal.toFixed(1)}
                  </span>
                </Badge>
              )}
              {showBoardRank && (boardRankImage || boardRankName) && (
                <Badge
                  variant="outline"
                  className="gap-1 bg-background/60 backdrop-blur"
                >
                  {boardRankImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={boardRankImage}
                      alt={boardRankName || "board rank"}
                      className="aspect-square w-3.5 shrink-0 object-contain"
                    />
                  )}
                  {boardRankName && <span>{boardRankName}</span>}
                </Badge>
              )}
              {showBoardRank && (
                <Badge
                  variant="outline"
                  className="gap-1 bg-background/60 backdrop-blur text-amber-700 dark:text-amber-400"
                >
                  <span className="font-bold">P</span>
                  <span className="tabular-nums">{point.toLocaleString()}</span>
                </Badge>
              )}
              {tetherEnabled && (
                <Badge
                  variant="outline"
                  className={cn(
                    "gap-1 bg-background/60 backdrop-blur",
                    kycVerified
                      ? "text-emerald-700 dark:text-emerald-400"
                      : "text-muted-foreground"
                  )}
                >
                  {kycVerified ? (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  ) : (
                    <ShieldAlert className="w-3.5 h-3.5" />
                  )}
                  <span>KYC {kycVerified ? "인증" : "미인증"}</span>
                </Badge>
              )}
              <Badge
                variant="outline"
                className={cn(
                  "gap-1 bg-background/60 backdrop-blur",
                  emailVerified
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-muted-foreground"
                )}
              >
                {emailVerified ? (
                  <MailCheck className="w-3.5 h-3.5" />
                ) : (
                  <Mail className="w-3.5 h-3.5" />
                )}
                <span>이메일 {emailVerified ? "인증" : "미인증"}</span>
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ProfileHero;
