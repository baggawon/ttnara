import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { handleConnect } from "@/helpers/server/prisma";
import { ToastData } from "@/helpers/toastData";

export interface EmailTemplateUpdateProps {
  id: number;
  subject: string;
  body: string;
  footer_text?: string | null;
  contact_email?: string | null;
  sender_id?: number | null;
  is_active?: boolean;
}

export const POST = async (json: EmailTemplateUpdateProps) => {
  try {
    if (typeof json?.id !== "number" || json.id === 0)
      throw ToastData.emailTemplateUpdateFailed;

    await requestValidator([RequestValidator.Admin], json);

    const subject = (json.subject ?? "").trim();
    const body = json.body ?? "";
    if (!subject || !body.trim()) throw ToastData.emailTemplateUpdateFailed;

    const footer =
      typeof json.footer_text === "string" && json.footer_text.trim()
        ? json.footer_text
        : null;
    const contactEmail =
      typeof json.contact_email === "string" && json.contact_email.trim()
        ? json.contact_email.trim()
        : null;
    const senderId = typeof json.sender_id === "number" ? json.sender_id : null;

    const updated = await handleConnect((prisma) =>
      prisma.email_template.update({
        where: { id: json.id },
        data: {
          subject,
          body,
          footer_text: footer,
          contact_email: contactEmail,
          sender_id: senderId,
          ...(typeof json.is_active === "boolean"
            ? { is_active: json.is_active }
            : {}),
        },
      })
    );
    if (!updated) throw ToastData.emailTemplateUpdateFailed;

    return {
      result: true,
      message: ToastData.emailTemplateUpdate,
    };
  } catch (error) {
    return {
      result: false,
      message: String(error),
    };
  }
};
