import "server-only";
import { handleConnect } from "@/helpers/server/prisma";
import {
  EMAIL_TEMPLATE_VARS,
  type EmailRenderVars,
} from "@/helpers/emailTemplateVars";
import { findEmailTemplateDefault } from "@/helpers/emailTemplateDefaults";

export interface EmailTemplateContent {
  subject: string;
  body: string;
  footerText?: string | null;
}

export interface EmailRenderInput extends EmailRenderVars {
  logoUrl?: string | null;
}

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// Plain-text substitution for the subject line (SES Subject is not HTML).
const substitutePlain = (text: string, vars: EmailRenderVars): string => {
  let out = text;
  for (const v of EMAIL_TEMPLATE_VARS) {
    out = out.split(v.token).join(vars[v.key] ?? "");
  }
  return out;
};

// HTML-context substitution. The admin-authored text is escaped FIRST so any
// stray markup can't break the layout or inject content; only our controlled
// variable replacements introduce markup. Tokens like {{authCode}} survive
// escaping because braces aren't HTML-escaped.
const substituteHtml = (text: string, vars: EmailRenderVars): string => {
  let out = escapeHtml(text);
  for (const v of EMAIL_TEMPLATE_VARS) {
    const raw = vars[v.key] ?? "";
    let replacement: string;
    if (v.key === "authCode") {
      replacement = `<strong style="font-weight: 700; color: #020817">${escapeHtml(
        raw
      )}</strong>`;
    } else if (v.key === "contactEmail" && raw) {
      const safe = escapeHtml(raw);
      replacement = `<a href="mailto:${safe}" style="color: #1e293b">${safe}</a>`;
    } else {
      replacement = escapeHtml(raw);
    }
    out = out.split(v.token).join(replacement);
  }
  return out;
};

const renderParagraphs = (substitutedHtml: string): string =>
  substitutedHtml
    .split(/\n{2,}/)
    .map((para) => para.trim())
    .filter((para) => para.length > 0)
    .map(
      (para) =>
        `<p style="font-size: 16px; color: #0f172a; margin: 0 0 16px">${para.replace(
          /\n/g,
          "<br>"
        )}</p>`
    )
    .join("\n");

// The footer is fully admin-editable (notice + copyright), so it is rendered
// as small muted paragraphs the same way the body is — nothing here is
// hardcoded; brand/contact/year all arrive via variables.
const renderFooterParagraphs = (substitutedHtml: string): string =>
  substitutedHtml
    .split(/\n{2,}/)
    .map((para) => para.trim())
    .filter((para) => para.length > 0)
    .map(
      (para) =>
        `<p class="mso-break-all" style="margin: 0 0 8px; font-size: 12px; line-height: 20px; color: #475569">${para.replace(
          /\n/g,
          "<br>"
        )}</p>`
    )
    .join("\n");

export const renderEmailTemplate = (
  template: EmailTemplateContent,
  vars: EmailRenderInput
): { subject: string; html: string } => {
  const subject = substitutePlain(template.subject, vars);
  const bodyHtml = renderParagraphs(substituteHtml(template.body, vars));

  const trimmedFooter = template.footerText?.trim();
  const footerBlock = trimmedFooter
    ? `<div role="separator" style="height: 1px; line-height: 1px; background-color: #cbd5e1; margin-top: 24px; margin-bottom: 24px">&zwj;</div>
                  ${renderFooterParagraphs(substituteHtml(trimmedFooter, vars))}`
    : "";

  const siteName = vars.siteName ?? "";
  const safeSiteName = escapeHtml(siteName);
  const siteUrl = vars.siteUrl ?? "";
  const logoUrl = vars.logoUrl ?? null;
  const safeTitle = escapeHtml(subject);

  const logoMarkup = logoUrl
    ? `<a href="${escapeHtml(
        siteUrl || "#"
      )}" style="position: relative; margin-right: 8px; color: #fffffe"><img src="${escapeHtml(
        logoUrl
      )}" alt="${safeSiteName}" style="max-width: 100%; vertical-align: middle; height: 40px; width: 40px" width="40" height="40"></a>`
    : "";

  const html = `
<!DOCTYPE html>
<html lang="ko" xmlns:v="urn:schemas-microsoft-com:vml">
<head>
  <meta charset="utf-8">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no, url=no">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings xmlns:o="urn:schemas-microsoft-com:office:office">
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <style>
    td,th,div,p,a,h1,h2,h3,h4,h5,h6 {font-family: "Segoe UI", sans-serif; mso-line-height-rule: exactly;}
    .mso-break-all {word-break: break-all;}
  </style>
  <![endif]-->
  <title>${safeTitle}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet" media="screen">
  <style>
    @media (max-width: 600px) {
      .sm-p-6 {
        padding: 24px !important
      }
      .sm-px-4 {
        padding-left: 16px !important;
        padding-right: 16px !important
      }
      .sm-px-6 {
        padding-left: 24px !important;
        padding-right: 24px !important
      }
    }
  </style>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" media="screen" href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@100..900&display=swap">
</head>
<body style="margin: 0; width: 100%; background-color: #f8fafc; padding: 0; -webkit-font-smoothing: antialiased; word-break: break-word">
  <div role="article" aria-roledescription="email" aria-label="${safeTitle}" lang="ko">
    <div class="sm-px-4" style="background-color: #f8fafc; font-family: Noto Sans KR, sans-serif">
      <table align="center" style="margin: 0 auto" cellpadding="0" cellspacing="0" role="none">
        <tr>
          <td style="width: 552px; max-width: 100%">
            <div role="separator" style="line-height: 24px">&zwj;</div>
            <table style="width: 100%" cellpadding="0" cellspacing="0" role="none">
              <tr>
                <td class="sm-p-6" style="background-color: #fffffe; padding: 24px 36px; border: 1px solid #e2e8f0">
                  <h1 style="font-size: 30px; font-weight: 600; color: #0f172a">
                    ${logoMarkup}
                    ${safeSiteName}
                  </h1>
                  <div role="separator" style="line-height: 24px">&zwj;</div>
                  ${bodyHtml}
                  ${footerBlock}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  </div>
</body>
</html>
`;

  return { subject, html };
};

export interface ResolvedEmailTemplate extends EmailTemplateContent {
  // The address the email is sent FROM (SES Source) — separate from the
  // contact address shown to users.
  senderEmail: string;
  // The literal "reply / get help here" address surfaced via {{contactEmail}}.
  contactEmail: string;
}

// Loads the editable template for a given case key and resolves which sender
// address it should be sent from. Falls back to built-in default copy when no
// DB row exists yet, and to the default/any active sender (then env) when the
// case has no explicit sender selected.
export const loadEmailTemplateForSend = async (
  key: string
): Promise<ResolvedEmailTemplate> => {
  const envSender = process.env.SES_SENDER_EMAIL ?? "";

  const template = await handleConnect((prisma) =>
    prisma.email_template.findUnique({
      where: { key },
      include: { sender: true },
    })
  );

  let senderEmail = "";
  if (template?.sender && template.sender.is_active) {
    senderEmail = template.sender.email;
  } else {
    const fallbackSender = await handleConnect((prisma) =>
      prisma.email_sender.findFirst({
        where: { is_active: true },
        orderBy: [{ is_default: "desc" }, { id: "asc" }],
      })
    );
    senderEmail = fallbackSender?.email || envSender;
  }

  if (template) {
    return {
      subject: template.subject,
      body: template.body,
      footerText: template.footer_text,
      senderEmail,
      contactEmail: template.contact_email ?? "",
    };
  }

  const fallback = findEmailTemplateDefault(key);
  return {
    subject: fallback?.subject ?? "[{{siteName}}] 알림",
    body: fallback?.body ?? "",
    footerText: fallback?.footerText ?? null,
    senderEmail,
    contactEmail: "",
  };
};
