import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { handleConnect } from "@/helpers/server/prisma";
import { ToastData } from "@/helpers/toastData";

export interface EmailSenderInput {
  id?: number;
  label: string;
  email: string;
  is_active: boolean;
  is_default: boolean;
}

export interface EmailSendersSaveProps {
  senders: EmailSenderInput[];
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const POST = async (json: EmailSendersSaveProps) => {
  try {
    await requestValidator([RequestValidator.Admin], json);

    const incoming = Array.isArray(json?.senders) ? json.senders : [];
    const cleaned = incoming
      .map((s) => ({
        id: typeof s.id === "number" ? s.id : undefined,
        label: (s.label ?? "").trim(),
        email: (s.email ?? "").trim(),
        is_active: s.is_active !== false,
        is_default: s.is_default === true,
      }))
      .filter((s) => s.label && s.email);

    if (cleaned.length === 0) throw ToastData.emailSenderSaveFailed;
    for (const s of cleaned) {
      if (!EMAIL_RE.test(s.email)) throw ToastData.emailSenderSaveFailed;
    }

    // Force exactly one default among the active addresses (fall back to the
    // whole list if none are active). Prefer an explicitly flagged row.
    const activeOnes = cleaned.filter((s) => s.is_active);
    const defaultPool = activeOnes.length ? activeOnes : cleaned;
    const chosen = defaultPool.find((s) => s.is_default) ?? defaultPool[0];
    cleaned.forEach((s) => {
      s.is_default = s === chosen;
    });

    const saved = await handleConnect((prisma) =>
      prisma.$transaction(async (tx) => {
        const existingRows = await tx.email_sender.findMany({
          select: { id: true },
        });
        const keepIds = new Set(
          cleaned.filter((s) => s.id).map((s) => s.id as number)
        );
        const toDelete = existingRows
          .filter((row) => !keepIds.has(row.id))
          .map((row) => row.id);

        // Referencing templates use onDelete: SetNull, so removing a sender
        // simply reverts those cases to the default sender at send time.
        if (toDelete.length) {
          await tx.email_sender.deleteMany({ where: { id: { in: toDelete } } });
        }

        for (const s of cleaned) {
          if (s.id) {
            await tx.email_sender.update({
              where: { id: s.id },
              data: {
                label: s.label,
                email: s.email,
                is_active: s.is_active,
                is_default: s.is_default,
              },
            });
          } else {
            await tx.email_sender.create({
              data: {
                label: s.label,
                email: s.email,
                is_active: s.is_active,
                is_default: s.is_default,
              },
            });
          }
        }
        return true;
      })
    );

    if (!saved) throw ToastData.emailSenderSaveFailed;

    return {
      result: true,
      message: ToastData.emailSenderSave,
    };
  } catch (error) {
    return {
      result: false,
      message: String(error),
    };
  }
};
