export enum BoardActivityAction {
  post_create = "post_create",
  post_edit = "post_edit",
  post_delete = "post_delete",
  post_read = "post_read",
  comment_create = "comment_create",
  comment_edit = "comment_edit",
  comment_delete = "comment_delete",
  upvote = "upvote",
  upvote_cancel = "upvote_cancel",
  downvote = "downvote",
  downvote_cancel = "downvote_cancel",
  vote_switch = "vote_switch",
}

export const BOARD_ACTIVITY_LABEL: Record<string, string> = {
  [BoardActivityAction.post_create]: "게시글 작성",
  [BoardActivityAction.post_edit]: "게시글 수정",
  [BoardActivityAction.post_delete]: "게시글 삭제",
  [BoardActivityAction.post_read]: "게시글 조회",
  [BoardActivityAction.comment_create]: "댓글 작성",
  [BoardActivityAction.comment_edit]: "댓글 수정",
  [BoardActivityAction.comment_delete]: "댓글 삭제",
  [BoardActivityAction.upvote]: "추천",
  [BoardActivityAction.upvote_cancel]: "추천 취소",
  [BoardActivityAction.downvote]: "비추천",
  [BoardActivityAction.downvote_cancel]: "비추천 취소",
  [BoardActivityAction.vote_switch]: "투표 변경",
};

export const boardActivityLabel = (action: string): string =>
  BOARD_ACTIVITY_LABEL[action] ?? action;
