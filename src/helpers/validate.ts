import { ValidateStatus } from "@/helpers/types";
import { TetherMethods, ValidateEmailStatus } from "@/helpers/types";
import { MAXNUMBER } from "@/helpers/config";
import { ToastData } from "@/helpers/toastData";
import type { UserSettings } from "@/app/api/signup/read";
import type { level_setting } from "@prisma/client";
import type { RanksListResponse } from "@/app/api/admin_di2u3k2j/ranks/read";

export const validNumber = ({
  value,
  min = 0,
  max = MAXNUMBER,
  maxDecimal = 0,
  sumAnother = 0,
}: {
  value?: string;
  min?: number;
  max?: number;
  maxDecimal?: number;
  sumAnother?: number;
}) => {
  try {
    let result = false;
    const maxDigit = String(max).length;
    const isNumber = new RegExp(
      `^[-]?(\\d{1,${maxDigit}}([.]\\d{0,${maxDecimal}})?)?$`,
      "i"
    );
    if (
      (typeof value === "number" || (value && value !== "")) &&
      isNumber.test(value)
    ) {
      const number = Number(value);
      if (
        (number >= min &&
          Number(sumAnother) + number <= max &&
          Number(sumAnother) > 0) ||
        (number >= min && number <= max && Number(sumAnother) === 0)
      ) {
        result = true;
      }
    }
    return result;
  } catch (error) {
    throw error;
  }
};

const isValidNumberInput = (
  value: number | undefined,
  min: number,
  max: number
) => {
  if (value === undefined || value === null) {
    return false;
  }

  // Convert the value to a string and check if it matches a plain number pattern
  const valueStr = value.toString();
  const plainNumberPattern = /^-?\d+(\.\d+)?$/; // Matches integers and decimals without 'e'

  if (!plainNumberPattern.test(valueStr)) {
    return false;
  }

  return value >= min && value <= max;
};

export const validateNumberInRange = (
  value: string | undefined,
  min: number,
  max: number,
  maxDecimal: number = 0
) => {
  if (value === null || value === undefined || value === "") {
    return "숫자를 입력해주세요.";
  }

  // Convert value to string to ensure split can be called
  const valueStr = String(value);

  // Check for decimal places if maxDecimal is provided
  const decimalPart = valueStr.split(".")[1];
  if (decimalPart) {
    if (maxDecimal === 0) {
      return `소수점은 입력할 수 없습니다.`;
    }
    if (decimalPart.length > maxDecimal) {
      return `소수점은 최대 ${maxDecimal}자리까지 입력 가능합니다.`;
    }
    // Check for trailing zeros if maxDecimal is 0
    if (Number(decimalPart) === 0) {
      return `소수점은 입력할 수 없습니다.`;
    }
  }

  const numberValue = Number(valueStr);

  // Use validNumberInput to check if the value is a valid number
  if (!isValidNumberInput(numberValue, min, max)) {
    return `${min} 이상 ${max} 이하의 숫자로 입력해주세요.`;
  }

  return undefined;
};

export enum invalidEmailCases {
  empty = "이메일을 입력해 주세요.",
  invalidFormat = "이메일 형태로 입력해 주세요.",
  needCertified = "먼저 이메일을 인증하여야 합니다.",
}
export const validateValidEmail = (
  value: string | undefined,
  validate: ValidateStatus | ""
) => {
  if (!value) {
    return invalidEmailCases.empty;
  }
  const regEmail =
    /^[0-9a-zA-Z]([-_\\.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_\\.]?[0-9a-zA-Z])*\.[a-zA-Z]{2,3}$/;
  if (!regEmail.test(value)) {
    return invalidEmailCases.invalidFormat;
  }
  if (validate !== "" && validate !== ValidateStatus.valid) {
    return invalidEmailCases.needCertified;
  }
};

export enum ValidateEmailCode {
  empty = "인증번호를 입력해주세요.",
  invalidFormat = "인증번호는 6자리여야 합니다.",
  fail = "인증번호가 일치하지 않습니다.",
  timeout = "인증메일이 만료되었습니다.",
  request = "인증을 완료하여야 합니다.",
}
export const validateEmailCode = (
  value: string | undefined,
  validate: string
) => {
  if (!value) {
    return ValidateEmailCode.empty;
  }
  if (value.length !== 6) {
    return ValidateEmailCode.invalidFormat;
  }
  if (validate === ValidateEmailStatus.request) {
    return ValidateEmailCode.request;
  }
  if (validate === ValidateEmailStatus.fail) {
    return ValidateEmailCode.fail;
  }
  if (validate === ValidateEmailStatus.timeout) {
    return ValidateEmailCode.timeout;
  }
};

export enum ValidatePassword {
  empty = "비밀번호를 입력해주세요.",
  short = "비밀번호는 6자리 이상이여야 합니다.",
  long = "비밀번호는 13자리 미만이여야 합니다.",
}
export const validatePassword = (value?: string, use = true) => {
  if (!value && use) {
    return ValidatePassword.empty;
  }
  if (value) {
    if (value.length < 6) {
      return ValidatePassword.short;
    }
    if (value.length > 12) {
      return ValidatePassword.long;
    }
  }
};

export enum ValidateConfirmPassword {
  empty = "비밀번호 확인을 입력해주세요.",
  short = "비밀번호 확인은 6자리 이상이여야 합니다.",
  long = "비밀번호 확인은 13자리 미만이여야 합니다.",
  notMatch = "비밀번호와 일치하지 않습니다.",
}
export const validateConfirmPassword = (
  value?: string,
  prevPassword?: string,
  use = true
) => {
  if (!value && use) {
    return ValidateConfirmPassword.empty;
  }
  if (value) {
    if (value.length < 6) {
      return ValidateConfirmPassword.short;
    }
    if (value.length > 12) {
      return ValidateConfirmPassword.long;
    }
    if (value !== prevPassword) return ValidateConfirmPassword.notMatch;
  }
};

export enum ValidateNameCode {
  empty = "아이디를 입력해주세요.",
}

export const validateUserName = (value?: string) => {
  if (!value || value === "") {
    return ValidateNameCode.empty;
  }
};

export enum ValidateNickNameCode {
  empty = "닉네임을 입력해주세요.",
}

export const validateNickName = (
  value: string | undefined,
  userSettingData: UserSettings | null
) => {
  if (!value || value === "" || !userSettingData) {
    return ValidateNickNameCode.empty;
  }
  const { min_displayname_length: min, max_displayname_length: max } =
    userSettingData;
  const length = value.length;
  const validNumberResult = validNumber({
    value: String(length),
    min,
    max,
  });
  if (!validNumberResult) {
    return `닉네임은 ${min}이상 ${max}이하의 길이로 입력해주세요.`;
  }
};

export enum ValidateMessageContent {
  empty = "메시지를 입력해주세요.",
}

export const validateMessageContent = (value?: string) => {
  if (!value || value === "") {
    return ValidateMessageContent.empty;
  }
};

export const validatephone = (value?: string) => {
  if (!value) {
    return "연락처를 입력해 주세요";
  }
  if (!/^\d{2,3}\d{3,4}\d{4}$/.test(value)) {
    return "9글자 이상의 숫자로만 입력해 주세요";
  }
};

export type isValidateType =
  | "used"
  | "no_user"
  | "already_add"
  | "owner"
  | "valid"
  | "time_out"
  | "otp_error"
  | "";

export const validatePhoneNumber = (value?: string) => {
  if (!value) {
    return "전화번호를 입력해 주세요.";
  }
  if (!/^01([0|1|6|7|8|9])([0-9]{3,4})([0-9]{4})$/.test(value)) {
    return "전화번호 형식으로 숫자만 입력해 주세요.";
  }
};

export const validateRequestId = ([request_id, isValidate]: [
  string,
  isValidateType,
]) => {
  if (
    (request_id !== "" && isValidate !== "valid") ||
    ["otp_error", "time_out"].includes(isValidate)
  )
    return true;
};

export const validatePhoneNumberInput = ([request_id, isValidate]: [
  string,
  isValidateType,
]) => {
  if (request_id !== "" || isValidate === "valid") return true;
};

export const validateOtpDisable = ([request_id, isValidate]: [
  string,
  isValidateType,
]) => ["otp_error", "time_out"].includes(isValidate);

export const validateOtpNumber = (
  value: string | undefined,
  message?: ToastData
) => {
  if (message === ToastData.otpError) {
    return "인증번호가 일치하지 않습니다.";
  }
  if (message === ToastData.timeOut) {
    return "유효시간이 초과되었습니다. 다시 시도해 주세요.";
  }
  if (!value) {
    return "인증번호를 입력해 주세요.";
  }
  if (value?.length !== 6) {
    return "인증번호 6자리를 입력해 주세요.";
  }
};

export const validateSiteName = (value: string | undefined) => {
  if (!value || value === "") {
    return "사이트 이름을 입력해주세요.";
  }
};

export const validateUserLogSaveDays = (value: string | undefined) => {
  const validNumberResult = validNumber({ value, min: 0 });
  if (!validNumberResult) {
    return `사용자 로그 보관 기간은 0이상 ${MAXNUMBER.toLocaleString()}이하의 숫자로 입력해주세요.`;
  }
};

export const validateAdminLogSaveDays = (value: string | undefined) => {
  const validNumberResult = validNumber({ value, min: 0 });
  if (!validNumberResult) {
    return `관리자 로그 보관 기간은 0이상 ${MAXNUMBER.toLocaleString()}이하의 숫자로 입력해주세요.`;
  }
};

export const validateMaxSystemLevel = (value: string | undefined) => {
  const max = 10;
  const validNumberResult = validNumber({ value, min: 1, max });
  if (!validNumberResult) {
    return `최대 시스템 레벨은 1이상 ${max.toLocaleString()}이하의 숫자로 입력해주세요.`;
  }
};

export const validateMinDisplayNameLength = (
  value: string | undefined,
  max: string | undefined
) => {
  const validNumberResult = validNumber({
    value,
    min: 0,
    max: Number(max),
  });
  if (!validNumberResult || !max || max === "") {
    if (max === "") {
      return "최대 길이부터 입력해주세요.";
    }
    if (Number(max) < Number(value)) {
      return `최대 길이보다 작은 숫자로 입력해주세요.`;
    }
    return `닉네임 최소 길이는 ${(max !== "" && Number(max) < MAXNUMBER ? max : MAXNUMBER)?.toLocaleString()}이하의 숫자로 입력해주세요.`;
  }
};

export const validateMaxDisplayNameLength = (
  value: string | undefined,
  min: string | undefined
) => {
  const validNumberResult = validNumber({ value, min: Number(min) });
  if (!validNumberResult || !min || min === "") {
    if (min === "") {
      return "최소 길이부터 입력해주세요.";
    }
    if (Number(min) > Number(value)) {
      return `최소 길이보다 큰 숫자로 입력해주세요.`;
    }
    return `닉네임 최대 길이는 ${(min !== "" && Number(min) > 0 ? min : 0)?.toLocaleString()}이상의 숫자로 입력해주세요.`;
  }
};

export const validateGeneralAuthLevel = (value: string | undefined) => {
  const max = 1000;
  const validNumberResult = validNumber({ value, min: 1, max });
  if (!validNumberResult) {
    return `기본 권한 레벨은 1이상 ${max.toLocaleString()}이하의 숫자로 입력해주세요.`;
  }
};

export const validateGeneralUserLevel = (value: string | undefined) => {
  const max = 1000;
  const validNumberResult = validNumber({ value, min: 1, max });
  if (!validNumberResult) {
    return `기본 사용자 레벨은 1이상 ${max.toLocaleString()}이하의 숫자로 입력해주세요.`;
  }
};

export const validateUserDeleteDays = (value: string | undefined) => {
  const validNumberResult = validNumber({ value, min: 0 });
  if (!validNumberResult) {
    return `비활성된 유저 데이터 유지기간 일은 0이상 ${MAXNUMBER.toLocaleString()}이하의 숫자로 입력해주세요.`;
  }
};

export const validateUserLevel = (value: string | undefined) => {
  const validNumberResult = validNumber({ value, min: 1 });
  if (!validNumberResult) {
    return `유저 권한 레벨은 1이상 ${MAXNUMBER.toLocaleString()}이하의 숫자로 입력해주세요.`;
  }
};

export const validateAuthLevel = (
  value: string | undefined,
  levelSetting: level_setting | null
) => {
  if (!value || value === "" || !levelSetting) {
    return "권한 레벨을 입력해주세요.";
  }
  const { max_system_level: max } = levelSetting;
  const validNumberResult = validNumber({
    value,
    min: 1,
    max,
  });
  if (!validNumberResult) {
    return `권한 레벨은 1이상 ${max.toLocaleString()}이하의 숫자로 입력해주세요.`;
  }
};

export const validatePoint = (value: string | undefined) => {
  if (value === undefined || value === "") {
    return "포인트를 입력해주세요.";
  }
  const validNumberResult = validNumber({ value, min: 0 });
  if (!validNumberResult) {
    return `포인트는 0이상의 정수로 입력해주세요.`;
  }
};

export const validateMaxThreadTitleLength = (
  value: string | undefined,
  min: string | undefined
) => {
  const validNumberResult = validNumber({ value, min: Number(min) });
  if (!validNumberResult || !min || min === "") {
    if (min === "") {
      return "최소 글 제목 길이부터 입력해주세요.";
    }
    if (Number(min) > Number(value)) {
      return `최소 길이보다 큰 숫자로 입력해주세요.`;
    }
    return `최대 글 제목 길이는 ${(min !== "" && Number(min) > 0 ? min : 0)?.toLocaleString()}이상의 숫자로 입력해주세요.`;
  }
};

export const validateMaxThreadContentLength = (
  value: string | undefined,
  min: string | undefined
) => {
  const validNumberResult = validNumber({ value, min: Number(min) });
  if (!validNumberResult || !min || min === "") {
    if (min === "") {
      return "최소 글 내용 길이부터 입력해주세요.";
    }
    if (Number(min) > Number(value)) {
      return `최소 길이보다 큰 숫자로 입력해주세요.`;
    }
    return `최대 글 내용 길이는 ${(min !== "" && Number(min) > 0 ? min : 0)?.toLocaleString()}이상의 숫자로 입력해주세요.`;
  }
};

export const validateMaxThreadCommentLength = (
  value: string | undefined,
  min: string | undefined
) => {
  const validNumberResult = validNumber({ value, min: Number(min) });
  if (!validNumberResult || !min || min === "") {
    if (min === "") {
      return "최소 댓글 길이부터 입력해주세요.";
    }
    if (Number(min) > Number(value)) {
      return `최소 길이보다 큰 숫자로 입력해주세요.`;
    }
    return `최대 댓글 길이는 ${(min !== "" && Number(min) > 0 ? min : 0)?.toLocaleString()}이상의 숫자로 입력해주세요.`;
  }
};

export const validateMinThreadTitleLength = (
  value: string | undefined,
  max: string | undefined
) => {
  const validNumberResult = validNumber({
    value,
    min: 0,
    max: Number(max),
  });
  if (!validNumberResult || !max || max === "") {
    if (max === "") {
      return "최대 글 제목 길이부터 입력해주세요.";
    }
    if (Number(max) < Number(value)) {
      return `최대 길이보다 작은 숫자로 입력해주세요.`;
    }
    return `최소 글 제목 길이는 ${(max !== "" && Number(max) < MAXNUMBER ? max : MAXNUMBER)?.toLocaleString()}이하의 숫자로 입력해주세요.`;
  }
};

export const validateMinThreadContentLength = (
  value: string | undefined,
  max: string | undefined
) => {
  const validNumberResult = validNumber({
    value,
    min: 0,
    max: Number(max),
  });
  if (!validNumberResult || !max || max === "") {
    if (max === "") {
      return "최대 글 내용 길이부터 입력해주세요.";
    }
    if (Number(max) < Number(value)) {
      return `최대 길이보다 작은 숫자로 입력해주세요.`;
    }
    return `최소 글 내용 길이는 ${(max !== "" && Number(max) < MAXNUMBER ? max : MAXNUMBER)?.toLocaleString()}이하의 숫자로 입력해주세요.`;
  }
};

export const validateMinThreadCommentLength = (
  value: string | undefined,
  max: string | undefined
) => {
  const validNumberResult = validNumber({
    value,
    min: 0,
    max: Number(max),
  });
  if (!validNumberResult || !max || max === "") {
    if (max === "") {
      return "최대 댓글 길이부터 입력해주세요.";
    }
    if (Number(max) < Number(value)) {
      return `최대 길이보다 작은 숫자로 입력해주세요.`;
    }
    return `최소 댓글 길이는 ${(max !== "" && Number(max) < MAXNUMBER ? max : MAXNUMBER)?.toLocaleString()}이하의 숫자로 입력해주세요.`;
  }
};

export const validateAllowedExtensions = (value: string | undefined) => {
  if (typeof value === "string") {
    if (value.endsWith(",")) {
      return "확장자를 입력해주세요.";
    }
  }
};

export const validateMaxFileSize = (value: string | undefined) => {
  if (value === undefined || value === "") {
    return "파일 최대 크기를 입력해주세요.";
  }
  const validNumberResult = validNumber({ value, min: 1 });
  if (!validNumberResult) {
    return `파일 최대 크기는 1이상 ${MAXNUMBER.toLocaleString()}이하의 숫자로 입력해주세요.`;
  }
};

export const validateToipcName = (value?: string) => {
  if (!value || value === "") {
    return "게시판 이름을 입력해주세요.";
  }
};

export const validateToipcURL = (value?: string) => {
  if (!value || value === "") {
    return "게시판 경로를 입력해주세요.";
  }
};

export const validateTopicDisplayOrder = (value: string | undefined) => {
  const validNumberResult = validNumber({ value, min: 0 });
  if (!validNumberResult) {
    return `게시판 표시 순서는 0이상 ${MAXNUMBER.toLocaleString()}이하의 숫자로 입력해주세요.`;
  }
};

export const validateReadLevel = (value: string | undefined) => {
  const validNumberResult = validNumber({ value, min: 0 });
  if (!validNumberResult) {
    return `읽기 레벨은 0이상 ${MAXNUMBER.toLocaleString()}이하의 숫자로 입력해주세요.`;
  }
};

export const validateCreateLevel = (value: string | undefined) => {
  const validNumberResult = validNumber({ value, min: 0 });
  if (!validNumberResult) {
    return `글 작성 레벨은 0이상 ${MAXNUMBER.toLocaleString()}이하의 숫자로 입력해주세요.`;
  }
};

export const validateCommentLevel = (value: string | undefined) => {
  const validNumberResult = validNumber({ value, min: 0 });
  if (!validNumberResult) {
    return `댓글 레벨은 0이상 ${MAXNUMBER.toLocaleString()}이하의 숫자로 입력해주세요.`;
  }
};

export const validateDownloadLevel = (value: string | undefined) => {
  const validNumberResult = validNumber({ value, min: 0 });
  if (!validNumberResult) {
    return `다운로드 레벨은 0이상 ${MAXNUMBER.toLocaleString()}이하의 숫자로 입력해주세요.`;
  }
};

export const validateModeratorLevel = (value: string | undefined) => {
  const validNumberResult = validNumber({ value, min: 0 });
  if (!validNumberResult) {
    return `주제 관리권한 레벨은 0이상 ${MAXNUMBER.toLocaleString()}이하의 숫자로 입력해주세요.`;
  }
};

export const validateThreadDisableEdit = (value: string | undefined) => {
  const validNumberResult = validNumber({ value, min: 0 });
  if (!validNumberResult) {
    return `글 수정 불가 댓글 수는 0이상 ${MAXNUMBER.toLocaleString()}이하의 숫자로 입력해주세요.`;
  }
};

export const validateThreadDisableDelete = (value: string | undefined) => {
  const validNumberResult = validNumber({ value, min: 0 });
  if (!validNumberResult) {
    return `글 삭제 불가 댓글 수는 0이상 ${MAXNUMBER.toLocaleString()}이하의 숫자로 입력해주세요.`;
  }
};

export const validateMaxUpload = (value: string | undefined) => {
  const validNumberResult = validNumber({ value, min: 0 });
  if (!validNumberResult) {
    return `최대 업로드 수는 0이상 ${MAXNUMBER.toLocaleString()}이하의 숫자로 입력해주세요.`;
  }
};

export const validateComment = (value?: string) => {
  if (!value || value === "") {
    return "댓글을 입력해주세요.";
  }
};

export const validateTetherCategoryName = (value?: string) => {
  if (!value || value === "") {
    return "지역 이름을 입력해주세요.";
  }
};

export const validateTradeType = (value?: string) => {
  if (!value || value === "") {
    return "거래를 선택해주세요.";
  }
};

export const validateMessenger = (value?: string) => {
  if (!value || value === "") {
    return "메신져를 선택해주세요.";
  }
};

export const validateCoin = (value?: string) => {
  if (!value || value === "") {
    return "코인을 선택해주세요.";
  }
};

export const validateTradeMethod = (value?: string) => {
  if (!value || value === "") {
    return "결제수단을 선택해주세요.";
  }
};

export const validateTradePriceType = (value?: string) => {
  if (!value || value === "") {
    return "가격 기준을 선택해주세요.";
  }
};

export const validateTradeMinQty = (
  value: string | undefined,
  max: string | undefined
) => {
  if (typeof value === "string") value = value.replace(/,/g, "");
  if (typeof max === "string") max = max.replace(/,/g, "");
  const min = 1;
  const validNumberResult = validNumber({ value, min, max: Number(max) });
  if (!validNumberResult || !max || max === "") {
    if (max === "") {
      return "최대 거래 개수부터 입력해주세요.";
    }
    if (Number(max) < Number(value)) {
      return `최대 거래 개수보다 작은 숫자로 입력해주세요.`;
    }
    if (Number(value) < min) {
      return `최소 거래 개수는 ${min}이상의 숫자로 입력해주세요.`;
    }
    return `최소 거래 개수는 ${(max !== "" && Number(max) < MAXNUMBER ? max : MAXNUMBER)?.toLocaleString()}이하의 숫자로 입력해주세요.`;
  }
};

export const validateTradeMaxQty = (
  value: string | undefined,
  min: string | undefined
) => {
  if (typeof value === "string") value = value.replace(/,/g, "");
  if (typeof min === "string") min = min.replace(/,/g, "");
  const validNumberResult = validNumber({ value, min: Number(min) });
  if (!validNumberResult || !min || min === "") {
    if (min === "") {
      return "최소 거래 개수부터 입력해주세요.";
    }
    if (Number(min) > Number(value)) {
      return `최소 거래 개수보다 큰 숫자로 입력해주세요.`;
    }
    return `최대 거래 개수는 ${(min !== "" && Number(min) > 0 ? min : 0)?.toLocaleString()}이상의 숫자로 입력해주세요.`;
  }
};

export const validateTradeFixedPrice = (
  value: string | undefined,
  isUse: boolean
) => {
  if (isUse) {
    if (typeof value === "string") value = value.replace(/,/g, "");
    const validNumberResult = validNumber({ value, min: 0 });
    if (!validNumberResult) {
      return `고정 가격은 0이상 ${MAXNUMBER.toLocaleString()}이하의 숫자로 입력해주세요.`;
    }
  }
};

export const validateTradeMargin = (
  value: string | undefined,
  isUse: boolean
) => {
  if (isUse) {
    if (typeof value === "string") value = value.replace(/,/g, "");
    const validNumberResult = validNumber({ value, min: 0, maxDecimal: 2 });
    if (!validNumberResult) {
      return `거래 마진은 0이상 ${MAXNUMBER.toLocaleString()}이하로 입력해주세요.`;
    }
  }
};

export const validateTradePassword = (
  value: string | undefined,
  isUse: boolean
) => {
  if (isUse) {
    if (!value || value === "") {
      return "거래 비밀번호 4자리를 입력해주세요.";
    }
    if (value !== undefined && value !== "") {
      const isNumber = new RegExp(`^[-]?(\\d{1,${4}}([.]\\d{0,${0}})?)?$`, "i");
      const validNumberResult = isNumber.test(value);
      if (!validNumberResult) {
        return `${TetherMethods.Promise} 비밀버호는 4자리 숫자로 입력해주세요.`;
      }
    }
  }
};

export const validateTradeName = (value?: string) => {
  if (!value || value === "") {
    return "거래 제목을 입력해주세요.";
  }
};

export const validateProposalQty = (
  value: string | undefined,
  min: number,
  max: number
) => {
  if (typeof value === "string") value = value.replace(/,/g, "");
  const validNumberResult = validNumber({ value, min, max });
  if (!validNumberResult) {
    return `제안수량은 ${min.toLocaleString()}~${max.toLocaleString()}개 사이로 입력해주세요.`;
  }
};

export const validateTelegramId = (value?: string) => {
  if (!value || value === "") {
    return "텔레그램 아이디를 입력해주세요.";
  }
};

export const validateCity = (value?: string) => {
  if (!value || value === "") {
    return "지역을 선택해주세요.";
  }
};

export const validateCustomAddress = (value?: string) => {
  if (!value || value === "") {
    return "주소를 입력해주세요.";
  }
};

export const validateRankName = (value: string | undefined) => {
  // validate the length of string value. Between 1 and 10
  if (value && value.length < 1) {
    return `이름은 1자 이상으로 입력해주세요.`;
  }
  if (value && value.length > 10) {
    return `이름은 10자 이하로 입력해주세요.`;
  }
  return;
};

export const validateNumber = ({
  value,
  min,
  max,
  maxDecimal,
  positive,
}: {
  value: string | undefined;
  min?: number;
  max?: number;
  maxDecimal?: number;
  positive?: boolean;
}) => {
  // Return early if no value provided or if it's not a string
  if (!value || typeof value !== "string") {
    return;
  }

  // Check if it's a valid number
  if (isNaN(Number(value))) {
    return `숫자를 입력해주세요.`;
  }

  const num = Number(value);

  // Check for positive numbers if required
  if (positive && num < 0) {
    return `숫자는 0 이상으로 입력해주세요.`;
  }

  // Check minimum value
  if (min !== undefined && num < min) {
    return `숫자는 ${min} 이상으로 입력해주세요.`;
  }

  // Check maximum value
  if (max !== undefined && num > max) {
    return `숫자는 ${max} 이하로 입력해주세요.`;
  }

  // Check decimal places if maxDecimal is specified
  if (maxDecimal !== undefined) {
    const decimalPlaces = value.includes(".")
      ? value.split(".")[1]?.length || 0
      : 0;
    if (decimalPlaces > maxDecimal) {
      return `소수점 ${maxDecimal}자리까지만 입력 가능합니다.`;
    }
  }

  return;
};

export const validateMinTradeCount = (
  value: number,
  rank_level: number,
  ranksData: RanksListResponse | null
) => {
  if (!ranksData?.ranks) return true;

  // Find ranks with lower level
  const lowerRanks = ranksData.ranks.filter(
    (rank) => rank.rank_level < rank_level
  );

  // Find ranks with higher level
  const higherRanks = ranksData.ranks.filter(
    (rank) => rank.rank_level > rank_level
  );

  // Check if min_trade_count is higher than all lower ranks
  const isHigherThanLower = lowerRanks.every(
    (rank) => value > rank.min_trade_count
  );

  // Check if min_trade_count is lower than all higher ranks
  const isLowerThanHigher = higherRanks.every(
    (rank) => value < rank.min_trade_count
  );

  return isHigherThanLower && isLowerThanHigher;
};
