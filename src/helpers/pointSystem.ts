export enum PointKind {
  earn = "earn",
  spend = "spend",
  adjust = "adjust",
  refund = "refund",
}

export enum PointAction {
  // earn
  post_create = "post_create",
  post_read = "post_read",
  comment_create = "comment_create",
  upvote = "upvote",
  downvote = "downvote",
  // adjust (admin)
  admin_grant = "admin_grant",
  admin_deduct = "admin_deduct",
  // refund (anti-farming on quick self-delete)
  thread_delete_refund = "thread_delete_refund",
  comment_delete_refund = "comment_delete_refund",
  // earn (daily attendance)
  daily_checkin = "daily_checkin",
  attendance_streak_bonus = "attendance_streak_bonus",
}

export const POINT_ACTION_LABEL: Record<string, string> = {
  [PointAction.post_create]: "게시글 작성",
  [PointAction.post_read]: "게시글 조회",
  [PointAction.comment_create]: "댓글 작성",
  [PointAction.upvote]: "추천",
  [PointAction.downvote]: "비추천",
  [PointAction.admin_grant]: "관리자 지급",
  [PointAction.admin_deduct]: "관리자 차감",
  [PointAction.thread_delete_refund]: "게시글 삭제 회수",
  [PointAction.comment_delete_refund]: "댓글 삭제 회수",
  [PointAction.daily_checkin]: "출석체크",
  [PointAction.attendance_streak_bonus]: "출석 연속 보너스",
};

export const POINT_KIND_LABEL: Record<string, string> = {
  [PointKind.earn]: "적립",
  [PointKind.spend]: "사용",
  [PointKind.adjust]: "조정",
  [PointKind.refund]: "회수",
};

export const REFUND_WINDOW_HOURS = 24;

export const pointActionLabel = (action: string): string =>
  POINT_ACTION_LABEL[action] ?? action;

export const pointKindLabel = (kind: string): string =>
  POINT_KIND_LABEL[kind] ?? kind;
