import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";

export interface PushTemplateDeleteProps {
  ids: number[];
}

export const POST = async (json: PushTemplateDeleteProps) => {
  try {
    await requestValidator([RequestValidator.Admin], json);

    // handleConnect swallows DB errors and returns undefined; null-check so a
    // failed delete is reported as an error instead of a false success.
    const deleted = await handleConnect((prisma) =>
      prisma.push_template.deleteMany({
        where: { id: { in: json.ids } },
      })
    );
    if (!deleted) throw ToastData.pushTemplateDeleteFailed;

    return {
      result: true,
      isSuccess: true,
      hasMessage: ToastData.pushTemplateDelete,
    };
  } catch (error) {
    console.log("error", error);
    return {
      result: false,
      isSuccess: false,
      hasMessage: ToastData.pushTemplateDeleteFailed,
      message: String(error),
    };
  }
};
