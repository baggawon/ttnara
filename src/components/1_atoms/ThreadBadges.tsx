const HOT_COMMENT_THRESHOLD = 10;
const BEST_VIEW_THRESHOLD = 1000;

export const ThreadBadges = ({
  commentCount,
  views,
}: {
  commentCount: number;
  views: number;
}) => {
  const isHot = commentCount > HOT_COMMENT_THRESHOLD;
  const isBest = views > BEST_VIEW_THRESHOLD;

  if (!isHot && !isBest) return null;

  if (isHot && isBest) {
    return (
      <span className="shrink-0 text-xs rounded-sm bg-amber-50 dark:bg-amber-950 px-0.5">
        🏆🔥
      </span>
    );
  }

  return (
    <span className="shrink-0 text-xs">
      {isBest && "🏆"}
      {isHot && "🔥"}
    </span>
  );
};
