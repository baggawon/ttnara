import { UPLOAD_FILE_LIMIT } from "@/helpers/config";

export enum ToastData {
  requestValidate = "requestValidate",
  validValidate = "validValidate",
  failValidate = "failValidate",
  waitValidate = "waitValidate",
  timeoutValidate = "timeoutValidate",
  noAuth = "noAuth",
  unknown = "unknown",
  signup = "signup",
  notAllowSignup = "notAllowSignup",
  alreadyExistId = "alreadyExistId",
  alreadyExistDisplayname = "alreadyExistDisplayname",
  alreadyExistEmail = "alreadyExistEmail",
  alreadyExistIdAndDisplayname = "alreadyExistIdAndDisplayname",
  alreadySend = "alreadySend",
  timeOut = "timeOut",
  otpError = "otpError",
  sendOtp = "sendOtp",
  waitSend = "waitSend",
  tooManyAttempts = "tooManyAttempts",
  login = "login",
  oauth = "oauth",
  waitConfirm = "waitConfirm",
  accessDenied = "accessDenied",
  noDistributor = "noDistributor",
  blocked = "blocked",
  inactive = "inactive",
  settings = "settings",
  userUpdate = "userUpdate",
  signout = "signout",
  adminUserRead = "adminUserRead",
  adminUserCreate = "adminUserCreate",
  adminUserUpdate = "adminUserUpdate",
  adminUserDelete = "adminUserDelete",
  adminPointCreate = "adminPointCreate",
  adminPointNotFound = "adminPointNotFound",
  adminPointReset = "adminPointReset",
  adminUserDuplicate = "adminUserDuplicate",
  adminSiteUpdate = "adminSiteUpdate",
  adminForgot = "adminForgot",
  messageCreate = "messageCreate",
  messageDelete = "messageDelete",
  messageNoUser = "messageNoUser",
  attachedSizeLimit = "attachedSizeLimit",
  attachedTypeLimit = "attachedTypeLimit",
  attachedCountLimit = "attachedCountLimit",
  passwordUpdate = "passwordUpdate",
  oldVersion = "oldVersion",
  credit = "credit",
  adminNoticeCreate = "adminNoticeCreate",
  adminNoticeUpdate = "adminNoticeUpdate",
  adminBettingDelete = "adminBettingDelete",
  notExistPage = "notExistPage",
  threadCreate = "threadCreate",
  threadUpdate = "threadUpdate",
  threadDelete = "threadDelete",
  commentCreate = "commentCreate",
  commentUpdate = "commentUpdate",
  commentDelete = "commentDelete",
  existProposal = "existProposal",
  threadProposalCreate = "threadProposalCreate",
  threadProposalUpdate = "threadProposalUpdate",
  threadProposalCancel = "threadProposalCancel",
  threadProposalRateCreate = "threadProposalRateCreate",
  notMatchPassword = "notMatchPassword",
  tetherNeedLogin = "tetherNeedLogin",
  tetherAlreadyComplete = "tetherAlreadyComplete",
  tetherAlreadyCancel = "tetherAlreadyCancel",
  tetherProgress = "tetherProgress",
  tetherNeedKYC = "tetherNeedKYC",
  tetherPaused = "tetherPaused",
  systemTetherCancelAllSuccess = "systemTetherCancelAllSuccess",
  systemTetherCancelAllFailed = "systemTetherCancelAllFailed",
  systemTradeResetSuccess = "systemTradeResetSuccess",
  systemTradeResetFailed = "systemTradeResetFailed",
  systemP2pPauseUpdateSuccess = "systemP2pPauseUpdateSuccess",
  systemP2pPauseUpdateFailed = "systemP2pPauseUpdateFailed",
  subscribePush = "subscribePush",
  unsubscribePush = "unsubscribePush",
  sendMessageNeedLogin = "sendMessageNeedLogin",
  kycVerifyEmail = "kycVerifyEmail",
  kycCancel = "kycCancel",
  kycFail = "kycFail",
  kycSuccess = "kycSuccess",
  rankCreate = "rankCreate",
  rankUpdate = "rankUpdate",
  rankDelete = "rankDelete",
  rankMinTradeCount = "rankMinTradeCount",
  rankBatchCreate = "rankBatchCreate",
  rankNotFound = "rankNotFound",
  rankBadgeUpload = "rankBadgeUpload",
  rankBadgeDelete = "rankBadgeDelete",
  rankBadgeAssign = "rankBadgeAssign",
  rankBadgeUnassign = "rankBadgeUnassign",
  rankBadgeAssignConflict = "rankBadgeAssignConflict",
  rankBadgeRangeInvalid = "rankBadgeRangeInvalid",
  threadCreatePrismaError = "threadCreatePrismaError",
  threadAccessControlError = "threadAccessControlError",
  threadUpdatePrismaError = "threadUpdatePrismaError",
  apiHandleError = "apiHandleError",
  partnerCreate = "partnerCreate",
  partnerUpdate = "partnerUpdate",
  partnerDelete = "partnerDelete",
  partnerCreateFailed = "partnerCreateFailed",
  partnerUpdateFailed = "partnerUpdateFailed",
  partnerDeleteFailed = "partnerDeleteFailed",
  guaranteeCreate = "guaranteeCreate",
  guaranteeUpdate = "guaranteeUpdate",
  guaranteeDelete = "guaranteeDelete",
  guaranteeCreateFailed = "guaranteeCreateFailed",
  guaranteeUpdateFailed = "guaranteeUpdateFailed",
  guaranteeDeleteFailed = "guaranteeDeleteFailed",
  guaranteeBannerUpdate = "guaranteeBannerUpdate",
  guaranteeBannerUpdateFailed = "guaranteeBannerUpdateFailed",
  tetherCategoryRestore = "tetherCategoryRestore",
  tetherCategoryDuplicateDeleted = "tetherCategoryDuplicateDeleted",
  tetherCategoryDuplicateParent = "tetherCategoryDuplicateParent",
  tetherCategoryDuplicateChild = "tetherCategoryDuplicateChild",
  tetherCategoryRestoreConflict = "tetherCategoryRestoreConflict",
  guaranteeRegionCreate = "guaranteeRegionCreate",
  guaranteeRegionUpdate = "guaranteeRegionUpdate",
  guaranteeRegionDelete = "guaranteeRegionDelete",
  guaranteeRegionRestore = "guaranteeRegionRestore",
  guaranteeRegionNameRequired = "guaranteeRegionNameRequired",
  guaranteeRegionDuplicate = "guaranteeRegionDuplicate",
  guaranteeRegionDuplicateDeleted = "guaranteeRegionDuplicateDeleted",
  guaranteeRegionRestoreConflict = "guaranteeRegionRestoreConflict",
  pushSend = "pushSend",
  pushSendFailed = "pushSendFailed",
  pushTemplateCreate = "pushTemplateCreate",
  pushTemplateUpdate = "pushTemplateUpdate",
  pushTemplateDelete = "pushTemplateDelete",
  pushTemplateDeleteFailed = "pushTemplateDeleteFailed",
  chatSettingsUpdate = "chatSettingsUpdate",
  chatTopicSave = "chatTopicSave",
  chatTopicDelete = "chatTopicDelete",
  adminTopicCategoryHomeLocked = "adminTopicCategoryHomeLocked",
  chatNoticeSave = "chatNoticeSave",
  chatNoticeDelete = "chatNoticeDelete",
  chatBannedWordAdd = "chatBannedWordAdd",
  chatBannedWordDelete = "chatBannedWordDelete",
  chatFixedMessageSave = "chatFixedMessageSave",
  chatFixedMessageDelete = "chatFixedMessageDelete",
  chatModerationMute = "chatModerationMute",
  chatModerationUnmute = "chatModerationUnmute",
  chatModerationForgiveSpam = "chatModerationForgiveSpam",
  chatHistoryPurge = "chatHistoryPurge",
  chatModerationBan = "chatModerationBan",
  chatModerationUnban = "chatModerationUnban",
  chatModerationHide = "chatModerationHide",
  chatModerationUnhide = "chatModerationUnhide",
  chatReportSubmit = "chatReportSubmit",
  supportLinkCardCreate = "supportLinkCardCreate",
  supportLinkCardCreateFailed = "supportLinkCardCreateFailed",
  supportLinkCardUpdate = "supportLinkCardUpdate",
  supportLinkCardUpdateFailed = "supportLinkCardUpdateFailed",
  supportLinkCardDelete = "supportLinkCardDelete",
  supportLinkCardDeleteFailed = "supportLinkCardDeleteFailed",
  supportQnaCategoryCreate = "supportQnaCategoryCreate",
  supportQnaCategoryCreateFailed = "supportQnaCategoryCreateFailed",
  supportQnaCategoryUpdate = "supportQnaCategoryUpdate",
  supportQnaCategoryUpdateFailed = "supportQnaCategoryUpdateFailed",
  supportQnaCategoryDelete = "supportQnaCategoryDelete",
  supportQnaCategoryDeleteFailed = "supportQnaCategoryDeleteFailed",
  supportQnaCreate = "supportQnaCreate",
  supportQnaCreateFailed = "supportQnaCreateFailed",
  supportQnaUpdate = "supportQnaUpdate",
  supportQnaUpdateFailed = "supportQnaUpdateFailed",
  supportQnaDelete = "supportQnaDelete",
  supportQnaDeleteFailed = "supportQnaDeleteFailed",
  insufficientPoints = "insufficientPoints",
  emailTemplateUpdate = "emailTemplateUpdate",
  emailTemplateUpdateFailed = "emailTemplateUpdateFailed",
  emailSenderSave = "emailSenderSave",
  emailSenderSaveFailed = "emailSenderSaveFailed",
}

export const toastData: { [key: string]: any } = {
  requestValidate: {
    success: { title: "인증메일이 발송되었습니다.", description: "" },
  },
  emailTemplateUpdate: {
    success: { title: "이메일 양식이 저장되었습니다.", description: "" },
  },
  emailTemplateUpdateFailed: {
    error: { title: "이메일 양식 저장에 실패했습니다.", description: "" },
  },
  emailSenderSave: {
    success: { title: "발신 이메일이 저장되었습니다.", description: "" },
  },
  emailSenderSaveFailed: {
    error: { title: "발신 이메일 저장에 실패했습니다.", description: "" },
  },
  validValidate: {
    success: { title: "인증이 완료되었습니다.", description: "" },
  },
  failValidate: {
    error: { title: "인증에 실패하였습니다.", description: "" },
  },
  waitValidate: {
    error: {
      title: "잠시 후에(최대1분) 이메일 인증 요청해주세요.",
      description: "",
    },
  },
  timeoutValidate: {
    success: { title: "인증 시간이 만료되었습니다.", description: "" },
  },
  unknown: {
    error: {
      title: "진행에 문제가 있습니다.",
      description: "오류가 발생했습니다. 관리자에게 문의해주세요.",
    },
  },
  threadAccessControlError: {
    error: {
      title: "API 접근 권한 오류",
      description: "",
    },
  },
  threadCreatePrismaError: {
    error: {
      title: "API - 새 글 작성에 실패했습니다",
      description: "",
    },
  },
  threadUpdatePrismaError: {
    error: {
      title: "API - 글 수정에 실패했습니다",
      description: "",
    },
  },
  signup: {
    success: {
      title: "회원가입이 완료되었습니다.",
      description: "로그인 해주세요.",
    },
  },
  notAllowSignup: {
    error: {
      title: "회원가입이 불가능합니다.",
      description: "",
    },
  },
  alreadyExistId: {
    error: {
      title: "이미 가입된 아이디입니다.",
      description: "",
    },
  },
  alreadyExistDisplayname: {
    error: {
      title: "이미 존재하는 닉네임입니다.",
      description: "",
    },
  },
  alreadyExistEmail: {
    error: {
      title: "이미 가입된 이메일입니다.",
      description: "",
    },
  },
  alreadyExistIdAndDisplayname: {
    error: {
      title: "이미 가입된 아이디와 닉네임입니다.",
      description: "",
    },
  },
  alreadySend: {
    error: {
      title: "인증번호가 이미 발송되었습니다.",
      description: "2분 후 재시도해주세요.",
    },
  },
  timeOut: {
    error: {
      title: "인증 시간이 만료되었습니다.",
      description: "",
    },
  },
  otpError: {
    error: {
      title: "인증번호가 일치하지 않습니다.",
      description: "",
    },
  },
  sendOtp: {
    success: {
      title: "인증번호가 발송되었습니다.",
      description: "",
    },
  },
  waitSend: {
    error: {
      title: "인증번호를 발송할 수 없습니다.",
      description: "2분 후 재시도해주세요.",
    },
  },
  tooManyAttempts: {
    error: {
      title: "너무 많은 시도로 5분간 차단되었습니다.",
      description: "",
    },
  },
  waitConfirm: {
    error: {
      title: "전화번호 인증완료 해주세요.",
      description: "전화번호 인증 후 가입완료 가능합니다.",
    },
  },
  blocked: {
    error: {
      title: "차단된 계정입니다.",
      description: "관리자에게 문의해주세요.",
    },
  },
  inactive: {
    error: {
      title: "탈퇴된 계정입니다.",
      description: "관리자에게 문의해주세요.",
    },
  },
  login: {
    success: {
      title: "로그인 되었습니다.",
      description: "환영합니다.",
    },
    error: {
      title: "로그인에 실패하였습니다.",
      description: "아이디와 비밀번호를 확인해주세요.",
    },
  },
  oauth: {
    success: {
      title: "소셜 로그인 되었습니다.",
      description: "환영합니다.",
    },
    error: {
      title: "소셜 로그인에 실패하였습니다.",
      description: "이미 가입된 이메일입니다.",
    },
  },
  accessDenied: {
    error: {
      title: "접근 권한이 없습니다.",
      description:
        "문제 해결을 원하시면, 문의 기능을 통해 연락주시기 바랍니다.",
    },
  },
  noDistributor: {
    error: {
      title: "존재하지 않는 추천코드입니다.",
      description: "",
    },
  },
  settings: {
    success: {
      title: "설정이 변경되었습니다.",
      description: "",
    },
  },
  userUpdate: {
    success: {
      title: "사용자 정보가 변경되었습니다.",
      description: "",
    },
    error: {
      title: "사용자 정보 변경에 실패하였습니다.",
      description: "",
    },
  },
  signout: {
    success: {
      title: "탈퇴 완료 되었습니다.",
      description: "",
    },
  },
  adminUserRead: {
    success: {
      title: "사용자 정보를 조회하였습니다.",
      description: "",
    },
    error: {
      title: "사용자 조회에 실패하였습니다.",
      description: "",
    },
  },
  adminUserCreate: {
    success: {
      title: "사용자가 등록되었습니다.",
      description: "",
    },
    error: {
      title: "사용자 등록에 실패하였습니다.",
      description: "",
    },
  },
  adminUserDelete: {
    success: {
      title: "사용자가 삭제되었습니다.",
      description: "",
    },
    error: {
      title: "사용자 삭제에 실패하였습니다.",
      description: "",
    },
  },
  adminPointCreate: {
    success: {
      title: "포인트가 변경되었습니다.",
      description: "",
    },
  },
  adminPointNotFound: {
    error: {
      title: "사용자 정보를 찾을 수 없습니다.",
      description: "",
    },
  },
  adminPointReset: {
    success: {
      title: "정산 초기화 되었습니다.",
      description: "",
    },
    error: {
      title: "정산 초기화에 실패하였습니다.",
      description: "",
    },
  },
  adminUserDuplicate: {
    error: {
      title: "이미 등록된 사용자입니다.",
      description: "아이디, 닉네임을 확인해주세요.",
    },
  },
  adminSiteUpdate: {
    success: {
      title: "사이트 설정이 변경되었습니다.",
      description: "",
    },
    error: {
      title: "사이트 설정 변경에 실패하였습니다.",
      description: "",
    },
  },
  adminUserUpdate: {
    success: {
      title: "사용자 정보가 변경되었습니다.",
      description: "",
    },
    error: {
      title: "사용자 정보 변경에 실패하였습니다.",
      description: "",
    },
  },
  adminForgot: {
    success: {
      title: "패스워드 초기화 이메일이 전송되었습니다.",
      description: "",
    },
    error: {
      title: "패스워드 초기화 이메일 전송에 실패하였습니다.",
      description: "",
    },
  },
  messageCreate: {
    success: {
      title: "메시지가 발송되었습니다.",
      description: "",
    },
    error: {
      title: "메시지 발송에 실패하였습니다.",
      description: "",
    },
  },
  messageDelete: {
    success: {
      title: "메시지가 삭제되었습니다.",
      description: "",
    },
    error: {
      title: "메시지 삭제에 실패하였습니다.",
      description: "",
    },
  },
  messageNoUser: {
    error: {
      title: "메시지를 보낼 사용자가 존재하지 않습니다.",
      description: "",
    },
  },
  attachedSizeLimit: {
    error: (value?: string) => ({
      title: "첨부파일 용량이 초과되었습니다.",
      description: value ? `파일당 최대 ${value}MB까지 업로드 가능합니다.` : "",
    }),
  },
  attachedTypeLimit: {
    error: {
      title: "첨부파일 형식이 올바르지 않습니다.",
      description: "",
    },
  },
  attachedCountLimit: {
    error: {
      title: "첨부파일 개수가 초과되었습니다.",
      description: `${UPLOAD_FILE_LIMIT}개까지 가능합니다.`,
    },
  },
  passwordUpdate: {
    success: {
      title: "비밀번호가 변경되었습니다.",
      description: "",
    },
    error: {
      title: "비밀번호 변경에 실패하였습니다.",
      description: "",
    },
  },
  adminNoticeCreate: {
    success: {
      title: "공지사항이 등록되었습니다.",
      description: "",
    },
    error: {
      title: "공지사항 등록에 실패하였습니다.",
      description: "",
    },
  },
  adminNoticeUpdate: {
    success: {
      title: "공지사항이 변경되었습니다.",
      description: "",
    },
    error: {
      title: "공지사항 변경에 실패하였습니다.",
      description: "",
    },
  },
  adminBettingDelete: {
    success: {
      title: "베팅이 삭제되었습니다.",
      description: "",
    },
    error: {
      title: "베팅 삭제에 실패하였습니다.",
      description: "",
    },
  },
  notExistPage: {
    error: {
      title: "해당 페이지가 존재하지 않습니다.",
      description: "",
    },
  },
  threadCreate: {
    success: {
      title: "게시글이 등록되었습니다.",
      description: "",
    },
    error: {
      title: "게시글 등록에 실패하였습니다.",
      description: "",
    },
  },
  threadUpdate: {
    success: {
      title: "게시글이 변경되었습니다.",
      description: "",
    },
    error: {
      title: "게시글 변경에 실패하였습니다.",
      description: "",
    },
  },
  threadDelete: {
    success: {
      title: "게시글이 삭제되었습니다.",
      description: "",
    },
    error: {
      title: "게시글 삭제에 실패하였습니다.",
      description: "",
    },
  },
  commentCreate: {
    success: {
      title: "댓글이 등록되었습니다.",
      description: "",
    },
    error: {
      title: "댓글 등록에 실패하였습니다.",
      description: "",
    },
  },
  commentUpdate: {
    success: {
      title: "댓글이 변경되었습니다.",
      description: "",
    },
    error: {
      title: "댓글 변경에 실패하였습니다.",
      description: "",
    },
  },
  commentDelete: {
    success: {
      title: "댓글이 삭제되었습니다.",
      description: "",
    },
    error: {
      title: "댓글 삭제에 실패하였습니다.",
      description: "",
    },
  },
  existProposal: {
    error: {
      title: "이미 거래가 존재합니다.",
      description: "",
    },
  },
  threadProposalCreate: {
    success: {
      title: "거래가 등록되었습니다.",
      description: "",
    },
    error: {
      title: "거래 등록에 실패하였습니다.",
      description: "",
    },
  },
  threadProposalUpdate: {
    success: {
      title: "거래가 변경되었습니다.",
      description: "",
    },
    error: {
      title: "거래 변경에 실패하였습니다.",
      description: "",
    },
  },
  threadProposalCancel: {
    success: {
      title: "거래가 취소되었습니다.",
      description: "",
    },
    error: {
      title: "거래 취소에 실패하였습니다.",
      description: "",
    },
  },
  threadProposalRateCreate: {
    success: {
      title: "거래가 완료되었습니다.",
      description: "",
    },
    error: {
      title: "거래 완료에 실패하였습니다.",
      description: "",
    },
  },
  notMatchPassword: {
    error: {
      title: "비밀번호가 일치하지 않습니다.",
      description: "",
    },
  },
  tetherNeedLogin: {
    error: {
      title: "로그인 후 조회가 가능합니다.",
      description: "",
    },
  },
  tetherAlreadyComplete: {
    error: {
      title: "거래가 완료된 게시물입니다.",
      description: "",
    },
  },
  tetherAlreadyCancel: {
    error: {
      title: "거래가 취소된 게시물입니다.",
      description: "",
    },
  },
  tetherProgress: {
    error: {
      title: "이미 거래 중인 게시물입니다.",
      description: "",
    },
  },
  tetherNeedKYC: {
    error: {
      title: "KYC 인증 완료 회원만 가능한 거래입니다.",
      description: "",
    },
  },
  tetherPaused: {
    error: {
      title: "현재 거래 게시가 일시 중단되었습니다.",
      description: "관리자에 의해 일시적으로 거래 등록이 제한됩니다.",
    },
  },
  systemTetherCancelAllSuccess: {
    success: {
      title: "모든 진행 중인 거래가 취소되었습니다.",
      description: "",
    },
  },
  systemTetherCancelAllFailed: {
    error: {
      title: "거래 일괄 취소에 실패했습니다.",
      description: "",
    },
  },
  systemTradeResetSuccess: {
    success: {
      title: "거래 기록이 초기화되었습니다.",
      description: "",
    },
  },
  systemTradeResetFailed: {
    error: {
      title: "거래 기록 초기화에 실패했습니다.",
      description: "",
    },
  },
  systemP2pPauseUpdateSuccess: {
    success: {
      title: "거래 게시 상태가 변경되었습니다.",
      description: "",
    },
  },
  systemP2pPauseUpdateFailed: {
    error: {
      title: "거래 게시 상태 변경에 실패했습니다.",
      description: "",
    },
  },
  subscribePush: {
    success: {
      title: "푸시 알림이 등록되었습니다.",
      description: "",
    },
    error: {
      title: "푸시 알림 등록에 실패하였습니다.",
      description: "",
    },
  },
  unsubscribePush: {
    success: {
      title: "푸시 알림이 해제되었습니다.",
      description: "",
    },
    error: {
      title: "푸시 알림 해제에 실패하였습니다.",
      description: "",
    },
  },
  sendMessageNeedLogin: {
    error: {
      title: "로그인 후 쪽지 발송이 가능합니다.",
      description: "",
    },
  },
  kycVerifyEmail: {
    error: {
      title: "이메일 인증 후 KYC 인증이 가능합니다.",
      description: "",
    },
  },
  kycCancel: {
    success: {
      title: "KYC 인증이 취소되었습니다.",
      description: "KYC 인증을 다시 진행해주세요.",
    },
  },
  kycFail: {
    error: (value?: string) => ({
      title: "KYC 인증에 실패하였습니다.",
      description: value,
    }),
  },
  kycSuccess: {
    success: {
      title: "KYC 인증이 완료되었습니다.",
      description: "",
    },
  },
  rankCreate: {
    success: {
      title: "등급이 생성되었습니다.",
      description: "",
    },
  },
  rankUpdate: {
    success: {
      title: "등급이 변경되었습니다.",
      description: "",
    },
  },
  rankDelete: {
    success: {
      title: "등급이 삭제되었습니다.",
      description: "",
    },
  },
  rankMinTradeCount: {
    error: {
      title: "거래 횟수가 올바르지 않습니다.",
      description:
        "기존 최고 등급보다 높은 등급는 거래 횟수가 더 많아야 하고, 기존 등급보다 낮은 등급는 거래 횟수가 더 적어야 합니다.",
    },
  },
  rankBatchCreate: {
    success: {
      title: "등급가 자동 생성되었습니다.",
      description: "기존 등급가 삭제되고 새로운 등급가 생성되었습니다.",
    },
    error: {
      title: "등급 자동 생성에 실패하였습니다.",
      description: "다시 시도해주세요.",
    },
  },
  rankBadgeUpload: {
    success: {
      title: "배지 이미지가 업로드되었습니다.",
      description: "",
    },
    error: {
      title: "배지 이미지 업로드에 실패하였습니다.",
      description: "다시 시도해주세요.",
    },
  },
  rankBadgeDelete: {
    success: {
      title: "배지 이미지가 삭제되었습니다.",
      description: "",
    },
    error: {
      title: "배지 이미지 삭제에 실패하였습니다.",
      description: "",
    },
  },
  rankBadgeAssign: {
    success: {
      title: "배지 이미지가 등급에 할당되었습니다.",
      description: "",
    },
    error: {
      title: "배지 이미지 할당에 실패하였습니다.",
      description: "",
    },
  },
  rankBadgeUnassign: {
    success: {
      title: "배지 이미지 할당이 해제되었습니다.",
      description: "",
    },
    error: {
      title: "할당 해제에 실패하였습니다.",
      description: "",
    },
  },
  rankBadgeAssignConflict: {
    error: (value?: string) => ({
      title: "다른 배지 이미지가 이미 할당되어 있습니다.",
      description:
        value ?? "충돌하는 등급의 할당을 먼저 해제한 뒤 다시 시도해주세요.",
    }),
  },
  rankBadgeRangeInvalid: {
    error: {
      title: "등급 범위가 올바르지 않습니다.",
      description: "시작 등급은 끝 등급보다 작거나 같아야 합니다.",
    },
  },
  apiHandleError: {
    error: (value?: string) => ({
      title: "API 처리에 실패하였습니다.",
      description: value,
    }),
  },
  partnerCreate: {
    success: {
      title: "협력사 배너가 생성되었습니다.",
      description: "",
    },
  },
  partnerUpdate: {
    success: {
      title: "협력사 배너가 변경되었습니다.",
      description: "",
    },
  },
  partnerDelete: {
    success: {
      title: "협력사 배너가 삭제되었습니다.",
      description: "",
    },
  },
  partnerCreateFailed: {
    error: {
      title: "협력사 배너 생성에 실패하였습니다.",
      description: "",
    },
  },
  partnerUpdateFailed: {
    error: {
      title: "협력사 배너 변경에 실패하였습니다.",
      description: "",
    },
  },
  partnerDeleteFailed: {
    error: {
      title: "협력사 배너 삭제에 실패하였습니다.",
      description: "",
    },
  },
  guaranteeCreate: {
    success: {
      title: "공식보증업체가 추가되었습니다.",
      description: "",
    },
  },
  guaranteeUpdate: {
    success: {
      title: "공식보증업체가 수정되었습니다.",
      description: "",
    },
  },
  guaranteeDelete: {
    success: {
      title: "공식보증업체가 삭제되었습니다.",
      description: "",
    },
  },
  guaranteeCreateFailed: {
    error: {
      title: "공식보증업체 생성에 실패하였습니다.",
      description: "",
    },
  },
  guaranteeUpdateFailed: {
    error: {
      title: "공식보증업체 수정에 실패하였습니다.",
      description: "",
    },
  },
  guaranteeDeleteFailed: {
    error: {
      title: "공식보증업체 삭제에 실패하였습니다.",
      description: "",
    },
  },
  guaranteeBannerUpdate: {
    success: {
      title: "배너 이미지가 저장되었습니다.",
      description: "",
    },
  },
  guaranteeBannerUpdateFailed: {
    error: {
      title: "배너 이미지 저장에 실패하였습니다.",
      description: "",
    },
  },
  tetherCategoryRestore: {
    success: {
      title: "지역이 복구되었습니다.",
      description: "",
    },
  },
  tetherCategoryDuplicateDeleted: {
    error: {
      title: "같은 이름의 삭제된 지역이 있습니다.",
      description: "삭제된 지역 목록에서 복구하여 사용해주세요.",
    },
  },
  tetherCategoryDuplicateParent: {
    error: {
      title: "같은 이름의 상위 지역이 이미 존재합니다.",
      description: "",
    },
  },
  tetherCategoryDuplicateChild: {
    error: {
      title: "같은 이름의 하위 지역이 이미 존재합니다.",
      description: "같은 상위 지역 아래에 동일한 이름을 사용할 수 없습니다.",
    },
  },
  tetherCategoryRestoreConflict: {
    error: {
      title: "복구할 수 없습니다.",
      description: "같은 이름의 지역이 이미 사용 중입니다.",
    },
  },
  guaranteeRegionCreate: {
    success: {
      title: "지역이 추가되었습니다.",
      description: "",
    },
  },
  guaranteeRegionUpdate: {
    success: {
      title: "지역이 수정되었습니다.",
      description: "",
    },
  },
  guaranteeRegionDelete: {
    success: {
      title: "지역이 삭제되었습니다.",
      description: "기존 공식보증업체에 저장된 지역명은 남아있습니다.",
    },
  },
  guaranteeRegionRestore: {
    success: {
      title: "지역이 복구되었습니다.",
      description: "",
    },
  },
  guaranteeRegionNameRequired: {
    error: {
      title: "지역 이름을 입력해주세요.",
      description: "",
    },
  },
  guaranteeRegionDuplicate: {
    error: {
      title: "같은 이름의 지역이 이미 존재합니다.",
      description: "",
    },
  },
  guaranteeRegionDuplicateDeleted: {
    error: {
      title: "같은 이름의 삭제된 지역이 있습니다.",
      description: "삭제된 지역 목록에서 복구하여 사용해주세요.",
    },
  },
  guaranteeRegionRestoreConflict: {
    error: {
      title: "복구할 수 없습니다.",
      description: "같은 이름의 지역이 이미 사용 중입니다.",
    },
  },
  pushSend: {
    success: {
      title: "푸시 알림이 발송되었습니다.",
      description: "",
    },
  },
  pushSendFailed: {
    error: {
      title: "푸시 알림 발송에 실패하였습니다.",
      description: "",
    },
  },
  pushTemplateCreate: {
    success: {
      title: "템플릿이 생성되었습니다.",
      description: "",
    },
  },
  pushTemplateUpdate: {
    success: {
      title: "템플릿이 변경되었습니다.",
      description: "",
    },
  },
  pushTemplateDelete: {
    success: {
      title: "템플릿이 삭제되었습니다.",
      description: "",
    },
  },
  pushTemplateDeleteFailed: {
    error: {
      title: "템플릿 삭제에 실패하였습니다.",
      description: "",
    },
  },
  chatSettingsUpdate: {
    success: { title: "채팅 설정이 저장되었습니다.", description: "" },
    error: { title: "채팅 설정 저장에 실패했습니다.", description: "" },
  },
  chatTopicSave: {
    success: { title: "채팅 토픽이 저장되었습니다.", description: "" },
    error: { title: "토픽 저장에 실패했습니다.", description: "" },
  },
  chatTopicDelete: {
    success: { title: "채팅 토픽이 삭제되었습니다.", description: "" },
    error: { title: "토픽 삭제에 실패했습니다.", description: "" },
  },
  chatNoticeSave: {
    success: { title: "공지가 저장되었습니다.", description: "" },
    error: { title: "공지 저장에 실패했습니다.", description: "" },
  },
  chatNoticeDelete: {
    success: { title: "공지가 삭제되었습니다.", description: "" },
    error: { title: "공지 삭제에 실패했습니다.", description: "" },
  },
  chatBannedWordAdd: {
    success: (value?: string) => ({
      title: value
        ? `${value}개의 금지어가 추가되었습니다.`
        : "금지어가 추가되었습니다.",
      description: "",
    }),
    error: { title: "금지어 추가에 실패했습니다.", description: "" },
  },
  chatBannedWordDelete: {
    success: { title: "금지어가 삭제되었습니다.", description: "" },
    error: { title: "금지어 삭제에 실패했습니다.", description: "" },
  },
  chatFixedMessageSave: {
    success: { title: "고정 메시지가 저장되었습니다.", description: "" },
    error: { title: "고정 메시지 저장에 실패했습니다.", description: "" },
  },
  chatFixedMessageDelete: {
    success: { title: "고정 메시지가 삭제되었습니다.", description: "" },
    error: { title: "고정 메시지 삭제에 실패했습니다.", description: "" },
  },
  chatModerationMute: {
    success: { title: "뮤트 처리되었습니다.", description: "" },
    error: { title: "뮤트 처리에 실패했습니다.", description: "" },
  },
  chatModerationUnmute: {
    success: { title: "뮤트가 해제되었습니다.", description: "" },
    error: { title: "뮤트 해제에 실패했습니다.", description: "" },
  },
  chatModerationForgiveSpam: {
    success: { title: "도배 상태가 해제되었습니다.", description: "" },
    error: { title: "도배 상태 해제에 실패했습니다.", description: "" },
  },
  chatHistoryPurge: {
    success: { title: "오래된 메시지가 삭제되었습니다.", description: "" },
    error: { title: "메시지 삭제에 실패했습니다.", description: "" },
  },
  chatModerationBan: {
    success: { title: "차단되었습니다.", description: "" },
    error: { title: "차단에 실패했습니다.", description: "" },
  },
  chatModerationUnban: {
    success: { title: "차단이 해제되었습니다.", description: "" },
    error: { title: "차단 해제에 실패했습니다.", description: "" },
  },
  chatModerationHide: {
    success: { title: "메시지가 숨김 처리되었습니다.", description: "" },
    error: { title: "메시지 숨김에 실패했습니다.", description: "" },
  },
  chatModerationUnhide: {
    success: { title: "메시지 숨김이 해제되었습니다.", description: "" },
    error: { title: "메시지 숨김 해제에 실패했습니다.", description: "" },
  },
  chatReportSubmit: {
    success: { title: "신고가 접수되었습니다.", description: "" },
    error: { title: "신고 접수에 실패했습니다.", description: "" },
  },
  supportLinkCardCreate: {
    success: { title: "링크 카드가 생성되었습니다.", description: "" },
  },
  supportLinkCardCreateFailed: {
    error: { title: "링크 카드 생성에 실패했습니다.", description: "" },
  },
  supportLinkCardUpdate: {
    success: { title: "링크 카드가 수정되었습니다.", description: "" },
  },
  supportLinkCardUpdateFailed: {
    error: { title: "링크 카드 수정에 실패했습니다.", description: "" },
  },
  supportLinkCardDelete: {
    success: { title: "링크 카드가 삭제되었습니다.", description: "" },
  },
  supportLinkCardDeleteFailed: {
    error: { title: "링크 카드 삭제에 실패했습니다.", description: "" },
  },
  supportQnaCategoryCreate: {
    success: { title: "카테고리가 생성되었습니다.", description: "" },
  },
  supportQnaCategoryCreateFailed: {
    error: { title: "카테고리 생성에 실패했습니다.", description: "" },
  },
  supportQnaCategoryUpdate: {
    success: { title: "카테고리가 수정되었습니다.", description: "" },
  },
  supportQnaCategoryUpdateFailed: {
    error: { title: "카테고리 수정에 실패했습니다.", description: "" },
  },
  supportQnaCategoryDelete: {
    success: { title: "카테고리가 삭제되었습니다.", description: "" },
  },
  supportQnaCategoryDeleteFailed: {
    error: { title: "카테고리 삭제에 실패했습니다.", description: "" },
  },
  adminTopicCategoryHomeLocked: {
    error: {
      title: "메인 홈 카드형 게시판은 카테고리를 직접 수정할 수 없습니다.",
      description: "카테고리는 외부 소스에서 자동으로 동기화됩니다.",
    },
  },
  supportQnaCreate: {
    success: { title: "QnA가 생성되었습니다.", description: "" },
  },
  supportQnaCreateFailed: {
    error: { title: "QnA 생성에 실패했습니다.", description: "" },
  },
  supportQnaUpdate: {
    success: { title: "QnA가 수정되었습니다.", description: "" },
  },
  supportQnaUpdateFailed: {
    error: { title: "QnA 수정에 실패했습니다.", description: "" },
  },
  supportQnaDelete: {
    success: { title: "QnA가 삭제되었습니다.", description: "" },
  },
  supportQnaDeleteFailed: {
    error: { title: "QnA 삭제에 실패했습니다.", description: "" },
  },
  insufficientPoints: {
    error: { title: "포인트가 부족합니다.", description: "" },
  },
};
