"use client";

import { cn } from "@/components/lib/utils";
import { isBoardPosterMasked } from "@/helpers/common";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface BoardRankProfileFields {
  current_board_rank_level?: number | null;
  current_board_rank_name?: string | null;
  current_board_rank_image?: string | null;
  is_app_admin?: boolean | null;
  auth_level?: number | null;
}

/**
 * Inline board-rank badge shown next to a poster's nickname in the forum UI.
 * Renders a square (1:1) `object-contain` icon so non-square source images
 * aren't stretched. `className` controls the size (defaults to 1.25rem).
 *
 * Renders nothing when:
 *  - there is no profile,
 *  - the poster is a masked moderator/admin (their 관리자 label hides standing),
 *  - the user has no assigned board-rank image.
 */
export const BoardRankIcon = ({
  profile,
  topicLevelModerator,
  className,
}: {
  profile: BoardRankProfileFields | null | undefined;
  topicLevelModerator?: number | null;
  className?: string;
}) => {
  if (!profile) return null;
  if (isBoardPosterMasked(profile, topicLevelModerator)) return null;
  const image = profile.current_board_rank_image;
  if (!image) return null;
  const name = profile.current_board_rank_name ?? "";

  const badge = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={image}
      alt={name || "board rank"}
      className={cn("aspect-square w-5 shrink-0 object-contain", className)}
    />
  );

  if (!name) return badge;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent>{name}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
