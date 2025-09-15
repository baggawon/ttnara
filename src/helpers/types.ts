import type { ToastData } from "@/helpers/toastData";
import type {
  message_inbox,
  message_history,
  user,
  profile,
  thread,
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
  tethersRead = "/api/tethers/read",
  tethersUpdate = "/api/tethers/update",
  tethersDelete = "/api/tethers/delete",
  tetherKrwRate = "/api/currency/tether",
  tethersProposalUpdate = "/api/tethers/proposal/update",
  tethersProposalRateUpdate = "/api/tethers/proposal/rate/update",
  threadCommentUpdate = "/api/threads/comment/update",
  threadCommentDelete = "/api/threads/comment/delete",
  summaryThreadsRead = "/api/summary_threads/read",
  partnersRead = "/api/partners/list",
  kyc = "/api/kyc",
  kycUpdate = "/api/kyc/update",
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
  adminTopicsRead = "/api/admin_di2u3k2j/topics/read",
  adminTopicsUpdate = "/api/admin_di2u3k2j/topics/update",
  adminTopicsDelete = "/api/admin_di2u3k2j/topics/delete",
  adminTopicCategoriesRead = "/api/admin_di2u3k2j/topics/categories/read",
  adminTopicCategoriesUpdate = "/api/admin_di2u3k2j/topics/categories/update",
  adminTopicCategoriesDelete = "/api/admin_di2u3k2j/topics/categories/delete",
  adminTetherCategoriesRead = "/api/admin_di2u3k2j/tether_category/read",
  adminTetherCategoriesUpdate = "/api/admin_di2u3k2j/tether_category/update",
  adminTetherCategoriesDelete = "/api/admin_di2u3k2j/tether_category/delete",
  adminRanksCreate = "/api/admin_di2u3k2j/ranks/create",
  adminRanksRead = "/api/admin_di2u3k2j/ranks/read",
  adminRanksUpdate = "/api/admin_di2u3k2j/ranks/update",
  adminRanksDelete = "/api/admin_di2u3k2j/ranks/delete",
  adminRanksBatchCreate = "/api/admin_di2u3k2j/ranks/batch-create",
  adminRanksBatchEdit = "/api/admin_di2u3k2j/ranks/batch-edit",
  initialize = "/api/initialize/data",
  ranksEvaluate = "/api/ranks/evaluate",
  threadRead = "/api/thread/read",
  topicSettingsRead = "/api/topic/read",
  adminUserRead = "/api/admin_di2u3k2j/user/read",
  adminUserUpdate = "/api/admin_di2u3k2j/user/update",
  adminPartnersRead = "/api/admin_di2u3k2j/partners/read",
  adminPartnersCreate = "/api/admin_di2u3k2j/partners/create",
  adminPartnersUpdate = "/api/admin_di2u3k2j/partners/update",
  adminPartnersDelete = "/api/admin_di2u3k2j/partners/delete",
  sitemap = "/api/sitemap",
}

export enum QueryKey {
  session = "session",
  account = "account",
  commonData = "commonData",
  deposit = "deposit",
  adminUsers = "adminUsers",
  loginHistory = "loginHistory",
  point = "point",
  message = "message",
  messageHistory = "messageHistory",
  messageInbox = "messageInbox",
  generalSettings = "generalSettings",
  threadSettings = "threadSettings",
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
  alarms = "alarms",
  userSubscription = "userSubscription",
  thread = "thread",
  topicSettings = "topicSettings",
  user = "user",
  partners = "partners",
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
  Partner = "/partners",
}

export enum AdminAppRoute {
  Dashboard = "/admin/dashboard",
  General = "/admin/general",
  Users = "/admin/users",
  Boards = "/admin/boards/topics",
  GeneralBoard = "/admin/boards/general",
  TetherBoard = "/admin/boards/tether",
  Partners = "/admin/partners",
  Popup = "/admin/popup",
  Secret = "/admin/secret",
  ConnectHistory = "/admin/connectHistory",
  ActionHistory = "/admin/actionHistory",
  DevBoard = "/admin/devBoard",
  Ranks = "/admin/ranks",
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

export enum TetherMethods {
  Promise = "약속거래",
  Public = "공개거래",
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

export enum AlarmTypes {
  Message = "message",
  P2PProgress = "p2pOpen",
  P2PComplete = "p2pComplete",
  P2PCancel = "p2pCancel",
  P2POwnerCancel = "p2pOwnerCancel",
  P2PProposalCancel = "p2pProposalCancel",
}
