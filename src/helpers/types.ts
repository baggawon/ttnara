import type { ToastData } from "@/helpers/toastData";
import type {
  message_inbox,
  message_history,
  user,
  profile,
} from "@prisma/client";

export enum ValidateEmailStatus {
  request = "request",
  valid = "valid",
  fail = "fail",
  wait = "wait",
  timeout = "timeout",
  idle = "idle",
}

export enum UserSettings {
  tether_notification = "tether_notification",
  message_notification = "message_notification",
  board_notification = "board_notification",
}

export interface UserAndAccount extends user {
  profile: Profile;
}

export interface UserAndSettings extends user {
  settings: {
    [key in UserSettings]: boolean;
  };
  profile: UserAndSettingsProfile | null;
  _count: {
    message_inbox: number;
  };
}

export interface UserAndSettingsProfile
  extends Pick<
    profile,
    | "phone_number"
    | "phone_is_validated"
    | "email"
    | "email_is_validated"
    | "displayname"
    | "auth_level"
    | "is_app_admin"
    | "kyc_id"
    | "has_warranty"
    | "warranty_deposit_amount"
    | "current_rank_level"
    | "current_rank_name"
    | "current_rank_image"
    | "point"
  > {}

export interface ApiReturnProps {
  result: boolean;
  message?: ToastData | string;
  data?: any;
}

export enum ApiRoute {
  session = "/api/auth/session",
  login = "/api/login",
  signup = "/api/signup",
  signupRead = "/api/signup/read",
  otp = "/api/otp",
  forgot = "/api/forgot",
  passwordUpdate = "/api/password/update",
  settingsRead = "/api/settings/read",
  settingsUpdate = "/api/settings/update",
  alarmRead = "/api/alarm/read",
  alarmUpdate = "/api/alarm/update",
  pushUpdate = "/api/push/update",
  commonData = "/api/common/data",
  userUpdate = "/api/user/update",
  messageRead = "/api/message/read",
  messageCreate = "/api/message/create",
  messageUpdate = "/api/message/update",
  messageDelete = "/api/message/delete",
  threadsRead = "/api/threads/read",
  threadsUpdate = "/api/threads/update",
  threadsDelete = "/api/threads/delete",
  uploadsMedia = "/api/uploads/media",
  uploadsMediaList = "/api/uploads/media/list",
  tethersRead = "/api/tethers/read",
  tethersUpdate = "/api/tethers/update",
  tethersDelete = "/api/tethers/delete",
  tetherKrwRate = "/api/currency/tether",
  tethersProposalUpdate = "/api/tethers/proposal/update",
  tethersProposalRateUpdate = "/api/tethers/proposal/rate/update",
  threadVote = "/api/threads/vote",
  threadCommentUpdate = "/api/threads/comment/update",
  threadCommentDelete = "/api/threads/comment/delete",
  summaryThreadsRead = "/api/summary_threads/read",
  partnersRead = "/api/partners/list",
  kyc = "/api/kyc",
  kycUpdate = "/api/kyc/update",
  pointHistory = "/api/point/history",
  boardActivity = "/api/board/activity",
  adminUsersRead = "/api/admin_di2u3k2j/users/read",
  adminUsersUpdate = "/api/admin_di2u3k2j/users/update",
  adminGeneralRead = "/api/admin_di2u3k2j/settings/general/read",
  adminGeneralUpdate = "/api/admin_di2u3k2j/settings/general/update",
  adminLevelRead = "/api/admin_di2u3k2j/settings/level/read",
  adminLevelUpdate = "/api/admin_di2u3k2j/settings/level/update",
  adminUserSettingRead = "/api/admin_di2u3k2j/settings/user/read",
  adminUserSettingUpdate = "/api/admin_di2u3k2j/settings/user/update",
  adminThreadSettingsGeneralRead = "/api/admin_di2u3k2j/settings/thread/read",
  adminThreadSettingsGeneralUpdate = "/api/admin_di2u3k2j/settings/thread/update",
  adminTetherSettingsRead = "/api/admin_di2u3k2j/settings/tether/read",
  adminTetherSettingsUpdate = "/api/admin_di2u3k2j/settings/tether/update",
  tetherSettingsRead = "/api/tether/settings/read",
  adminTopicsRead = "/api/admin_di2u3k2j/topics/read",
  adminTopicsUpdate = "/api/admin_di2u3k2j/topics/update",
  adminTopicsDelete = "/api/admin_di2u3k2j/topics/delete",
  adminTopicCategoriesRead = "/api/admin_di2u3k2j/topics/categories/read",
  adminTopicCategoriesUpdate = "/api/admin_di2u3k2j/topics/categories/update",
  adminTopicCategoriesDelete = "/api/admin_di2u3k2j/topics/categories/delete",
  adminTetherCategoriesRead = "/api/admin_di2u3k2j/tether_category/read",
  adminTetherCategoriesUpdate = "/api/admin_di2u3k2j/tether_category/update",
  adminTetherCategoriesDelete = "/api/admin_di2u3k2j/tether_category/delete",
  adminTetherCategoriesRestore = "/api/admin_di2u3k2j/tether_category/restore",
  adminRanksCreate = "/api/admin_di2u3k2j/ranks/create",
  adminRanksRead = "/api/admin_di2u3k2j/ranks/read",
  adminRanksUpdate = "/api/admin_di2u3k2j/ranks/update",
  adminRanksDelete = "/api/admin_di2u3k2j/ranks/delete",
  adminRanksBatchCreate = "/api/admin_di2u3k2j/ranks/batch-create",
  adminRanksBatchEdit = "/api/admin_di2u3k2j/ranks/batch-edit",
  adminRankBadgesList = "/api/admin_di2u3k2j/rank_badges/list",
  adminRankBadgesUpload = "/api/admin_di2u3k2j/rank_badges/upload",
  adminRankBadgesAssign = "/api/admin_di2u3k2j/rank_badges/assign",
  adminRankBadgesUnassign = "/api/admin_di2u3k2j/rank_badges/unassign",
  adminRankBadgesDelete = "/api/admin_di2u3k2j/rank_badges/delete",
  initialize = "/api/initialize/data",
  ranksEvaluate = "/api/ranks/evaluate",
  rankSummary = "/api/rank/summary",
  threadRead = "/api/thread/read",
  topicSettingsRead = "/api/topic/read",
  adminUserRead = "/api/admin_di2u3k2j/user/read",
  adminUserUpdate = "/api/admin_di2u3k2j/user/update",
  adminPointAdjust = "/api/admin_di2u3k2j/points/adjust",
  adminPartnersRead = "/api/admin_di2u3k2j/partners/read",
  adminPartnersCreate = "/api/admin_di2u3k2j/partners/create",
  adminPartnersUpdate = "/api/admin_di2u3k2j/partners/update",
  adminPartnersDelete = "/api/admin_di2u3k2j/partners/delete",
  guaranteeRead = "/api/guarantee/list",
  adminGuaranteeRead = "/api/admin_di2u3k2j/guarantee/read",
  adminGuaranteeCreate = "/api/admin_di2u3k2j/guarantee/create",
  adminGuaranteeUpdate = "/api/admin_di2u3k2j/guarantee/update",
  adminGuaranteeDelete = "/api/admin_di2u3k2j/guarantee/delete",
  adminGuaranteeBannerRead = "/api/admin_di2u3k2j/guarantee/banner/read",
  adminGuaranteeBannerUpdate = "/api/admin_di2u3k2j/guarantee/banner/update",
  adminGuaranteeRegionsRead = "/api/admin_di2u3k2j/guarantee_region/read",
  adminGuaranteeRegionsUpdate = "/api/admin_di2u3k2j/guarantee_region/update",
  adminGuaranteeRegionsDelete = "/api/admin_di2u3k2j/guarantee_region/delete",
  adminGuaranteeRegionsRestore = "/api/admin_di2u3k2j/guarantee_region/restore",
  adminPopupRead = "/api/admin_di2u3k2j/popup/read",
  adminPopupCreate = "/api/admin_di2u3k2j/popup/create",
  adminPopupUpdate = "/api/admin_di2u3k2j/popup/update",
  adminPopupDelete = "/api/admin_di2u3k2j/popup/delete",
  adminPushTemplateRead = "/api/admin_di2u3k2j/push-notification/template/read",
  adminPushTemplateCreate = "/api/admin_di2u3k2j/push-notification/template/create",
  adminPushTemplateUpdate = "/api/admin_di2u3k2j/push-notification/template/update",
  adminPushTemplateDelete = "/api/admin_di2u3k2j/push-notification/template/delete",
  adminPushSend = "/api/admin_di2u3k2j/push-notification/send",
  adminPushHistoryRead = "/api/admin_di2u3k2j/push-notification/history/read",
  adminSystemCancelActiveTethers = "/api/admin_di2u3k2j/system/cancel-active-tethers",
  adminSystemResetTradeRecords = "/api/admin_di2u3k2j/system/reset-trade-records",
  adminSystemP2pPause = "/api/admin_di2u3k2j/system/p2p-pause",
  popupList = "/api/popup/list",
  supportRead = "/api/support/read",
  sitemap = "/api/sitemap",
  leaderboardRead = "/api/leaderboard/read",
  leaderboardUserRead = "/api/leaderboard/user",
  boardPreviewRead = "/api/board-preview/read",
  adminChatSettingsRead = "/api/admin_di2u3k2j/chat/settings/read",
  adminChatSettingsUpdate = "/api/admin_di2u3k2j/chat/settings/update",
  adminChatTopicsRead = "/api/admin_di2u3k2j/chat/topics/read",
  adminChatTopicsUpdate = "/api/admin_di2u3k2j/chat/topics/update",
  adminChatTopicsDelete = "/api/admin_di2u3k2j/chat/topics/delete",
  adminChatNoticesRead = "/api/admin_di2u3k2j/chat/notices/read",
  adminChatNoticesUpdate = "/api/admin_di2u3k2j/chat/notices/update",
  adminChatNoticesDelete = "/api/admin_di2u3k2j/chat/notices/delete",
  adminChatBannedWordsRead = "/api/admin_di2u3k2j/chat/banned-words/read",
  adminChatBannedWordsUpdate = "/api/admin_di2u3k2j/chat/banned-words/update",
  adminChatBannedWordsDelete = "/api/admin_di2u3k2j/chat/banned-words/delete",
  adminChatModerationMute = "/api/admin_di2u3k2j/chat/moderation/mute",
  adminChatModerationUnmute = "/api/admin_di2u3k2j/chat/moderation/unmute",
  adminChatModerationBan = "/api/admin_di2u3k2j/chat/moderation/ban",
  adminChatModerationUnban = "/api/admin_di2u3k2j/chat/moderation/unban",
  adminChatModerationHide = "/api/admin_di2u3k2j/chat/moderation/hide",
  adminChatModerationUnhide = "/api/admin_di2u3k2j/chat/moderation/unhide",
  adminChatMutedUsers = "/api/admin_di2u3k2j/chat/moderation/muted",
  adminChatBannedUsers = "/api/admin_di2u3k2j/chat/moderation/banned",
  adminChatHiddenMessages = "/api/admin_di2u3k2j/chat/moderation/hidden",
  adminChatReports = "/api/admin_di2u3k2j/chat/moderation/reports",
  adminChatFixedMessagesRead = "/api/admin_di2u3k2j/chat/fixed-messages/read",
  adminChatFixedMessagesUpdate = "/api/admin_di2u3k2j/chat/fixed-messages/update",
  adminChatFixedMessagesDelete = "/api/admin_di2u3k2j/chat/fixed-messages/delete",
  adminChatHistoryRead = "/api/admin_di2u3k2j/chat/history/read",
  adminChatTopicStats = "/api/admin_di2u3k2j/chat/topics/stats",
  chatTokenIssue = "/api/chat/token",
  chatTopicsRead = "/api/chat/topics",
  chatReport = "/api/chat/report",
  navList = "/api/nav/list",
  adminNavList = "/api/admin_di2u3k2j/nav/list",
  adminNavCreate = "/api/admin_di2u3k2j/nav/create",
  adminNavUpdate = "/api/admin_di2u3k2j/nav/update",
  adminNavDelete = "/api/admin_di2u3k2j/nav/delete",
  adminNavReorder = "/api/admin_di2u3k2j/nav/reorder",
  adminSupportLinkCardsRead = "/api/admin_di2u3k2j/support/link-cards/read",
  adminSupportLinkCardsCreate = "/api/admin_di2u3k2j/support/link-cards/create",
  adminSupportLinkCardsUpdate = "/api/admin_di2u3k2j/support/link-cards/update",
  adminSupportLinkCardsDelete = "/api/admin_di2u3k2j/support/link-cards/delete",
  adminSupportQnaCategoriesRead = "/api/admin_di2u3k2j/support/qna-categories/read",
  adminSupportQnaCategoriesCreate = "/api/admin_di2u3k2j/support/qna-categories/create",
  adminSupportQnaCategoriesUpdate = "/api/admin_di2u3k2j/support/qna-categories/update",
  adminSupportQnaCategoriesDelete = "/api/admin_di2u3k2j/support/qna-categories/delete",
  adminSupportQnaRead = "/api/admin_di2u3k2j/support/qna/read",
  adminSupportQnaCreate = "/api/admin_di2u3k2j/support/qna/create",
  adminSupportQnaUpdate = "/api/admin_di2u3k2j/support/qna/update",
  adminSupportQnaDelete = "/api/admin_di2u3k2j/support/qna/delete",
}

export enum QueryKey {
  session = "session",
  account = "account",
  commonData = "commonData",
  deposit = "deposit",
  adminUsers = "adminUsers",
  loginHistory = "loginHistory",
  point = "point",
  pointHistory = "pointHistory",
  boardActivity = "boardActivity",
  message = "message",
  messageHistory = "messageHistory",
  messageInbox = "messageInbox",
  generalSettings = "generalSettings",
  threadSettings = "threadSettings",
  tetherSettings = "tetherSettings",
  adminTetherSettings = "adminTetherSettings",
  levelSettings = "levelSettings",
  userSettings = "userSettings",
  users = "users",
  signupSettings = "signupSettings",
  topics = "topics",
  categories = "categories",
  threads = "threads",
  summaryThreads = "summaryThreads",
  tethers = "tethers",
  tetherCategories = "tetherCategories",
  tetherKrwRate = "tetherKrwRate",
  ranks = "ranks",
  rankSummary = "rankSummary",
  rankBadges = "rankBadges",
  alarms = "alarms",
  userSubscription = "userSubscription",
  thread = "thread",
  topicSettings = "topicSettings",
  attachedMedia = "attachedMedia",
  user = "user",
  partners = "partners",
  guaranteeCompanies = "guaranteeCompanies",
  guaranteeBanner = "guaranteeBanner",
  guaranteeRegions = "guaranteeRegions",
  popups = "popups",
  leaderboard = "leaderboard",
  leaderboardUser = "leaderboardUser",
  chatSettings = "chatSettings",
  chatTopics = "chatTopics",
  adminChatTopics = "adminChatTopics",
  chatNotices = "chatNotices",
  chatBannedWords = "chatBannedWords",
  chatMutedUsers = "chatMutedUsers",
  chatBannedUsers = "chatBannedUsers",
  chatHiddenMessages = "chatHiddenMessages",
  chatReports = "chatReports",
  chatFixedMessages = "chatFixedMessages",
  chatHistory = "chatHistory",
  chatTopicStats = "chatTopicStats",
  boardPreview = "boardPreview",
  pushTemplates = "pushTemplates",
  pushHistory = "pushHistory",
  navMenuTop = "navMenuTop",
  navMenuMobileBottom = "navMenuMobileBottom",
  adminNavMenu = "adminNavMenu",
  adminSupportLinkCards = "adminSupportLinkCards",
  adminSupportQnaCategories = "adminSupportQnaCategories",
  adminSupportQna = "adminSupportQna",
  adminSupportQnaDetail = "adminSupportQnaDetail",
}

export type Profile = Pick<
  profile,
  "displayname" | "point" | "user_level" | "auth_level"
>;

export interface UserForControl
  extends Pick<user, "id" | "created_at" | "updated_at" | "username"> {
  profile: Profile;
}

export enum AuthRootUrls {
  app = "/app",
  admin = "/admin",
}

export enum AppRoute {
  Main = "/",
  Login = "/login",
  Signup = "/signup",
  Forgot = "/forgot",
  Support = "/support",
  AccountSetting = "/app/settings/account",
  TetherSetting = "/app/settings/tether",
  NotificationSetting = "/app/settings/notification",
  NotificationList = "/app/settings/notification_list",
  KYCSetting = "/app/settings/kyc",
  MessageInbox = "/app/message/inbox",
  MessageHistory = "/app/message/history",
  MessagePost = "/app/message/post",
  Error404 = "/404",
  Threads = "/board",
  Tether = "/board/tether",
  Leaderboard = "/leaderboard",
  Guarantee = "/guarantee",
  PointSetting = "/app/settings/point",
  BoardActivity = "/app/settings/activity",
  RankSetting = "/app/settings/rank",
}

export enum AdminAppRoute {
  Dashboard = "/admin/dashboard",
  General = "/admin/general",
  Users = "/admin/users",
  Boards = "/admin/boards/topics",
  GeneralBoard = "/admin/boards/general",
  TetherBoard = "/admin/boards/tether",
  Partners = "/admin/partners",
  Guarantee = "/admin/guarantee",
  Popup = "/admin/popup",
  Chat = "/admin/chat",
  Secret = "/admin/secret",
  ConnectHistory = "/admin/connectHistory",
  ActionHistory = "/admin/actionHistory",
  DevBoard = "/admin/devBoard",
  Ranks = "/admin/ranks",
  RankBadges = "/admin/ranks/badges",
  PushNotification = "/admin/push-notification",
  SystemControl = "/admin/system-control",
  Navigation = "/admin/navigation",
  Support = "/admin/support",
}

export interface MessageDatas {
  inbox: Message[];
  history: Message[];
}

export type Message = message_inbox | message_history;

export enum MessageType {
  inbox = "inbox",
  history = "history",
}

export enum ApiOtpType {
  EmailValid = "email_valid",
  EmailSignup = "email_signup",
  EmailForgotPassword = "email_forgotPassword",
  EmailSettings = "email_settings",
}

export enum ValidateStatus {
  progress = "progress",
  valid = "valid",
  fail = "fail",
}

export interface HelpFile {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  uploadFileName: string;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export enum TetherCategories {
  Total = "total",
  Buy = "buy",
  Sell = "sell",
}

export enum TetherOrderby {
  CreateNewer = "create_newer",
  PriceExpensive = "price_expensive",
  PriceCheap = "price_cheap",
  GoodTrader = "good_trader",
}

export enum TetherRange {
  Total = "total",
  In24Hours = "oneDay",
  InOneWeek = "oneWeek",
  InOneMonth = "oneMonth",
}

export enum TetherStatus {
  Open = "open",
  Progress = "progress",
  MyPageProgress = "myPageProgress",
  Cancel = "cancel",
  Complete = "complete",
  Total = "total",
}

export enum SearchType {
  제목 = "title",
  내용 = "content",
  제목_내용 = "title content",
  회원아이디 = "userData.username",
  글쓴이 = "userData.profile.displayname",
}

export enum TetherProposalStatus {
  Open = "open",
  Cancel = "cancel",
  Complete = "complete",
}

export enum TetherProposalMessengerTypes {
  Telegram = "telegram",
  KakaoTalk = "kakaoTalk",
}

export enum TetherPriceTypes {
  Fixed = "고정가격",
  Margin = "마진가격",
  Negotiation = "가격협의",
}

export enum TetherAddressTypes {
  Category = "카테고리",
  Custom = "직접입력",
}

export enum PushType {
  Subscribe = "subscribe",
  Unsubscribe = "unsubscribe",
}

export enum ForgotTypes {
  Id = "id",
  Password = "password",
}

export enum Currency {
  테더 = "Tether",
  트론 = "Tron",
  비트 = "Bitcoin",
  이더 = "Ethereum",
  USDC = "UsdCoin",
  원화 = "KRW",
  달러 = "USD",
}

export enum BroadcastChannels {
  Auth = "auth",
}

export enum BroadcastEvents {
  SignIn = "signIn",
  SignOut = "signOut",
}

export enum GuaranteePosition {
  Buy = "BUY",
  Sell = "SELL",
}

export const GuaranteePositionLabel: Record<GuaranteePosition, string> = {
  [GuaranteePosition.Buy]: "매수",
  [GuaranteePosition.Sell]: "매도",
};

export enum GuaranteeCurrency {
  USDT = "USDT",
  TRX = "TRX",
  BTC = "BTC",
  ETH = "ETH",
}

export enum AlarmTypes {
  Message = "message",
  P2PProgress = "p2pOpen",
  P2PComplete = "p2pComplete",
  P2PCancel = "p2pCancel",
  P2POwnerCancel = "p2pOwnerCancel",
  P2PProposalCancel = "p2pProposalCancel",
  P2PRateRequest = "p2pRateRequest",
  BoardComment = "boardComment",
  BoardAdminNotice = "boardAdminNotice",
  AdminManualPush = "adminManualPush",
}
