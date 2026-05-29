// Default copy for the built-in (system) email cases. Used to seed the
// email_template table on first admin read, and as the fallback the OTP send
// path renders from when no DB row exists yet. Intentionally brand-neutral —
// the brand name is injected at render time via {{siteName}}.

export interface EmailTemplateSeed {
  key: string;
  name: string;
  subject: string;
  body: string;
  footerText: string;
}

// Shared default footer (notice + copyright). Fully editable per case; uses
// variables so nothing about the brand is hardcoded. The contact line is left
// out by default — add it (with the {{contactEmail}} variable) once a 문의
// 이메일 address is set on the case.
const DEFAULT_FOOTER = [
  "본 이메일은 발신전용 주소입니다.",
  "",
  "© {{year}} {{siteName}}. ALL RIGHTS RESERVED.",
].join("\n");

export const EMAIL_TEMPLATE_DEFAULTS: EmailTemplateSeed[] = [
  {
    key: "email_signup",
    name: "회원가입 인증",
    subject: "[{{siteName}}] 인증메일입니다.",
    body: [
      "안녕하세요,",
      "{{siteName}} 이메일 인증 요청을 확인하였습니다.",
      "아래 인증번호를 사용하여 이메일 인증 절차를 계속 진행해 주세요.",
      "",
      "이 인증번호는 {{validityMinutes}}분 동안 유효합니다.",
      "만약 이 요청을 하지 않았다면, 이 이메일을 무시하셔도 좋습니다.",
      "",
      "인증 번호: {{authCode}}",
      "요청일: {{date}}",
    ].join("\n"),
    footerText: DEFAULT_FOOTER,
  },
  {
    key: "email_forgot_password",
    name: "비밀번호 재설정",
    subject: "[{{siteName}}] 인증메일입니다.",
    body: [
      "안녕하세요,",
      "{{siteName}} 비밀번호 재설정 요청을 확인하였습니다.",
      "아래 인증번호를 사용하여 비밀번호 재설정 절차를 계속 진행해 주세요.",
      "",
      "이 인증번호는 {{validityMinutes}}분 동안 유효합니다.",
      "만약 이 요청을 하지 않았다면, 이 이메일을 무시하셔도 좋습니다.",
      "",
      "인증 번호: {{authCode}}",
      "요청일: {{date}}",
    ].join("\n"),
    footerText: DEFAULT_FOOTER,
  },
  {
    key: "email_settings",
    name: "이메일 변경",
    subject: "[{{siteName}}] 인증메일입니다.",
    body: [
      "안녕하세요,",
      "{{siteName}} 이메일 변경 요청을 확인하였습니다.",
      "아래 인증번호를 사용하여 이메일 변경 절차를 계속 진행해 주세요.",
      "",
      "이 인증번호는 {{validityMinutes}}분 동안 유효합니다.",
      "만약 이 요청을 하지 않았다면, 이 이메일을 무시하셔도 좋습니다.",
      "",
      "인증 번호: {{authCode}}",
      "요청일: {{date}}",
    ].join("\n"),
    footerText: DEFAULT_FOOTER,
  },
];

export const findEmailTemplateDefault = (key: string) =>
  EMAIL_TEMPLATE_DEFAULTS.find((t) => t.key === key);
