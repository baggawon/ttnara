"use client";

import useGetQuery from "@/helpers/customHook/useGetQuery";
import { QueryKey } from "@/helpers/types";
import { boardPreviewGet, sessionGet } from "@/helpers/get";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type {
  BoardPreviewResponse,
  BoardPreviewThread,
  BoardPreviewTopic,
} from "@/app/api/board-preview/read";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import Link from "next/link";
import dayjs from "dayjs";
import { ThreadBadges } from "@/components/1_atoms/ThreadBadges";
import { getBoardPosterDisplayname } from "@/helpers/common";
import { BoardRankIcon } from "@/components/1_atoms/BoardRankIcon";
import type { Session } from "next-auth";

const DISPLAY_COUNT = 4;
const ROW_HEIGHT_CLASS = "h-[52px]";

const formatDate = (date: Date | string) => {
  const d = dayjs(date);
  const now = dayjs();
  if (d.isSame(now, "year")) return d.format("MM-DD");
  return d.format("YY-MM-DD");
};

const ThreadRow = ({
  thread,
  topicUrl,
  topicLevelModerator,
  viewer,
}: {
  thread: BoardPreviewThread;
  topicUrl: string;
  topicLevelModerator: number;
  viewer: Session["user"] | null | undefined;
}) => {
  const displayname = getBoardPosterDisplayname(
    {
      displayname: thread.displayname,
      is_app_admin: thread.is_app_admin,
      auth_level: thread.auth_level,
    },
    topicLevelModerator,
    viewer
  );
  return (
    <Link
      href={`/board/${topicUrl}/${thread.id}`}
      className={`${ROW_HEIGHT_CLASS} flex items-center gap-2 px-1 hover:bg-muted/40 transition-colors rounded`}
    >
      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="flex items-center gap-1 min-w-0">
          {thread.is_notice && (
            <span className="text-[10px] font-medium text-success shrink-0">
              공지
            </span>
          )}
          <ThreadBadges
            commentCount={thread.comment_count}
            views={thread.views}
          />
          <p className="text-sm truncate leading-snug min-w-0 flex-1">
            {thread.title}
          </p>
          {thread.comment_count > 0 && (
            <span className="text-[11px] text-blue-500 shrink-0">
              [{thread.comment_count}]
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 min-w-0">
          <BoardRankIcon
            profile={{
              current_board_rank_level: thread.current_board_rank_level,
              current_board_rank_name: thread.current_board_rank_name,
              current_board_rank_image: thread.current_board_rank_image,
              is_app_admin: thread.is_app_admin,
              auth_level: thread.auth_level,
            }}
            topicLevelModerator={topicLevelModerator}
            className="w-4 h-4 shrink-0"
          />
          <span className="text-[11px] text-muted-foreground truncate">
            {displayname}
          </span>
          <span className="text-[11px] text-muted-foreground shrink-0">
            {formatDate(thread.created_at)}
          </span>
        </div>
      </div>
    </Link>
  );
};

const EmptyRow = ({ showLabel = false }: { showLabel?: boolean }) => {
  return (
    <div
      className={`${ROW_HEIGHT_CLASS} flex items-center justify-center px-1`}
    >
      {showLabel && (
        <span className="text-xs text-muted-foreground">게시글 없음</span>
      )}
    </div>
  );
};

const TopicPreview = ({
  topic,
  viewer,
}: {
  topic: BoardPreviewTopic;
  viewer: Session["user"] | null | undefined;
}) => {
  const threads = topic.threads.slice(0, DISPLAY_COUNT);
  const emptyCount = DISPLAY_COUNT - threads.length;

  return (
    <div className="flex flex-col divide-y flex-1">
      {threads.map((thread) => (
        <ThreadRow
          key={thread.id}
          thread={thread}
          topicUrl={topic.url}
          topicLevelModerator={topic.level_moderator}
          viewer={viewer}
        />
      ))}
      {Array.from({ length: emptyCount }).map((_, index) => (
        <EmptyRow
          key={`empty-${index}`}
          showLabel={threads.length === 0 && index === 0}
        />
      ))}
    </div>
  );
};

const BoardPreviewWidget = ({
  topic,
  onRefresh,
  viewer,
}: {
  topic: BoardPreviewTopic;
  onRefresh: () => void;
  viewer: Session["user"] | null | undefined;
}) => {
  return (
    <Card className="h-full">
      <CardContent className="pt-4 h-full">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">{topic.name}</h2>
            <button
              type="button"
              onClick={onRefresh}
              className="p-1 rounded hover:bg-muted transition-colors"
              aria-label="새로고침"
            >
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Thread list */}
          <TopicPreview topic={topic} viewer={viewer} />

          {/* Footer */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t gap-2">
            <Link href={`/board/${topic.url}`} className="flex-1">
              <Button
                type="button"
                variant="outline"
                className="w-full h-9 text-sm"
              >
                더보기 ▼
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const BoardPreviewSection = () => {
  const queryClient = useQueryClient();
  const { data } = useGetQuery<BoardPreviewResponse | null, undefined>(
    { queryKey: [QueryKey.boardPreview] },
    boardPreviewGet,
    undefined,
    { silent: true }
  );

  const { data: session } = useGetQuery<Session | null | undefined, undefined>(
    { queryKey: [QueryKey.session] },
    sessionGet,
    undefined,
    { silent: true }
  );

  const topics = data?.topics ?? [];

  if (topics.length === 0) return null;

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: [QueryKey.boardPreview] });
  };

  return (
    <div className="md:col-span-2 4xl:col-span-1 flex flex-col md:flex-row 4xl:flex-col gap-4">
      {topics.map((topic) => (
        <div key={topic.id} className="flex-1 min-w-0 min-h-[300px]">
          <BoardPreviewWidget
            topic={topic}
            onRefresh={handleRefresh}
            viewer={session?.user}
          />
        </div>
      ))}
    </div>
  );
};

export default BoardPreviewWidget;
