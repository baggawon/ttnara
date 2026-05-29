import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { now } from "@/helpers/basic";
import { renderEmailTemplate } from "@/helpers/server/emailRender";
import { getBrandSettings } from "@/helpers/server/brandSettings";

export interface EmailTemplatePreviewProps {
  subject: string;
  body: string;
  footer_text?: string | null;
  contact_email?: string | null;
  sender_id?: number | null;
}

export const POST = async (json: EmailTemplatePreviewProps) => {
  try {
    await requestValidator([RequestValidator.Admin], json);

    const brand = await getBrandSettings();

    const { subject, html } = renderEmailTemplate(
      {
        subject: json.subject ?? "",
        body: json.body ?? "",
        footerText: json.footer_text ?? null,
      },
      {
        siteName: brand.siteName || "브랜드명",
        authCode: "123456",
        date: now().format("YYYY-MM-DD HH:mm:ss"),
        validityMinutes: "30",
        contactEmail: (json.contact_email ?? "").trim(),
        siteUrl: process.env.NEXTAUTH_URL ?? "",
        year: now().format("YYYY"),
        logoUrl: brand.faviconUrl ?? brand.logoImageUrl,
      }
    );

    return {
      result: true,
      data: { subject, html },
    };
  } catch (error) {
    return {
      result: false,
      message: String(error),
    };
  }
};
