import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { handleConnect } from "@/helpers/server/prisma";
import { ToastData } from "@/helpers/toastData";
import { EMAIL_TEMPLATE_DEFAULTS } from "@/helpers/emailTemplateDefaults";

export interface EmailTemplatesReadProps {}

export const GET = async (queryParams: EmailTemplatesReadProps) => {
  try {
    await requestValidator([RequestValidator.Admin], queryParams);

    // Seed a default sender from the configured env address on first visit so
    // the OTP flows have a "from" without manual setup.
    const senderCount = await handleConnect((prisma) =>
      prisma.email_sender.count()
    );
    if (!senderCount) {
      const envSender = process.env.SES_SENDER_EMAIL ?? "";
      if (envSender) {
        await handleConnect((prisma) =>
          prisma.email_sender.create({
            data: {
              label: "발신전용",
              email: envSender,
              is_default: true,
              is_active: true,
            },
          })
        );
      }
    }

    // Seed any missing built-in (system) cases with their default copy.
    const existing = await handleConnect((prisma) =>
      prisma.email_template.findMany({ select: { key: true } })
    );
    const existingKeys = new Set((existing ?? []).map((t) => t.key));
    const toCreate = EMAIL_TEMPLATE_DEFAULTS.filter(
      (d) => !existingKeys.has(d.key)
    );
    if (toCreate.length) {
      await handleConnect((prisma) =>
        prisma.email_template.createMany({
          data: toCreate.map((d) => ({
            key: d.key,
            name: d.name,
            subject: d.subject,
            body: d.body,
            footer_text: d.footerText,
            is_system: true,
            is_active: true,
          })),
          skipDuplicates: true,
        })
      );
    }

    const [templates, senders] = await Promise.all([
      handleConnect((prisma) =>
        prisma.email_template.findMany({
          orderBy: [{ is_system: "desc" }, { id: "asc" }],
        })
      ),
      handleConnect((prisma) =>
        prisma.email_sender.findMany({
          orderBy: [{ is_default: "desc" }, { id: "asc" }],
        })
      ),
    ]);

    return {
      result: true,
      data: {
        templates: templates ?? [],
        senders: senders ?? [],
      },
    };
  } catch (error) {
    return {
      result: false,
      message: String(error),
    };
  }
};
