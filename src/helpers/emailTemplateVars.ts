// Shared variable metadata for editable email templates. Imported by both the
// admin editor (client) and the server-side renderer, so the insert buttons and
// the substitution logic can never drift apart. Keep this free of server-only
// imports.

export type EmailVarKey =
  | "siteName"
  | "authCode"
  | "date"
  | "validityMinutes"
  | "contactEmail"
  | "siteUrl"
  | "year";

export interface EmailTemplateVar {
  key: EmailVarKey;
  token: string;
  label: string;
  description: string;
}

export const EMAIL_TEMPLATE_VARS: EmailTemplateVar[] = [
  {
    key: "siteName",
    token: "{{siteName}}",
    label: "사이트 이름",
    description: "설정된 브랜드(사이트) 이름",
  },
  {
    key: "authCode",
    token: "{{authCode}}",
    label: "인증번호",
    description: "발송 시 생성되는 인증번호 (굵게 표시됨)",
  },
  {
    key: "date",
    token: "{{date}}",
    label: "요청일시",
    description: "요청이 발생한 날짜와 시간",
  },
  {
    key: "validityMinutes",
    token: "{{validityMinutes}}",
    label: "유효시간(분)",
    description: "인증번호 유효 시간 (분 단위)",
  },
  {
    key: "contactEmail",
    token: "{{contactEmail}}",
    label: "문의 이메일",
    description: "문의 받을 이메일 주소 (발신 이메일과 별개, 양식별로 설정)",
  },
  {
    key: "siteUrl",
    token: "{{siteUrl}}",
    label: "사이트 주소",
    description: "사이트 기본 URL",
  },
  {
    key: "year",
    token: "{{year}}",
    label: "연도",
    description: "현재 연도 (예: 2026)",
  },
];

export type EmailRenderVars = Record<EmailVarKey, string>;
