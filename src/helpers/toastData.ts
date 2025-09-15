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
  rankBatchEdit = "rankBatchEdit",
  rankNotFound = "rankNotFound",
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
}

export const toastData: { [key: string]: any } = {
  requestValidate: {
    success: { title: "인증메일이 발송되었습니다.", description: "" },
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
    error: {
      title: "첨부파일 용량이 초과되었습니다.",
      description: "",
    },
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
        "기존 최고 랭크보다 높은 랭크는 거래 횟수가 더 많아야 하고, 기존 랭크보다 낮은 랭크는 거래 횟수가 더 적어야 합니다.",
    },
  },
  rankBatchCreate: {
    success: {
      title: "랭크가 자동 생성되었습니다.",
      description: "기존 랭크가 삭제되고 새로운 랭크가 생성되었습니다.",
    },
    error: {
      title: "랭크 자동 생성에 실패하였습니다.",
      description: "다시 시도해주세요.",
    },
  },
  rankBatchEdit: {
    success: {
      title: "랭크가 일괄 수정되었습니다.",
      description: "",
    },
    error: {
      title: "랭크 일괄 수정에 실패하였습니다.",
      description: "",
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
      title: "협력사가 생성되었습니다.",
      description: "",
    },
  },
  partnerUpdate: {
    success: {
      title: "협력사가 변경되었습니다.",
      description: "",
    },
  },
  partnerDelete: {
    success: {
      title: "협력사가 삭제되었습니다.",
      description: "",
    },
  },
  partnerCreateFailed: {
    error: {
      title: "협력사 생성에 실패하였습니다.",
      description: "",
    },
  },
  partnerUpdateFailed: {
    error: {
      title: "협력사 변경에 실패하였습니다.",
      description: "",
    },
  },
  partnerDeleteFailed: {
    error: {
      title: "협력사 삭제에 실패하였습니다.",
      description: "",
    },
  },
};
