import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";

export interface PushTemplateCreateProps {
  name: string;
  title: string;
  body: string;
  url?: string;
  category: string;
}

export const POST = async (json: PushTemplateCreateProps) => {
  try {
    await requestValidator([RequestValidator.Admin], json);

    const template = await handleConnect((prisma) =>
      prisma.push_template.create({
        data: {
          name: json.name,
          title: json.title,
          body: json.body,
          url: json.url || null,
          category: json.category || "general",
        },
      })
    );

    if (!template) throw ToastData.unknown;

    return {
      result: true,
      isSuccess: true,
      hasMessage: ToastData.pushTemplateCreate,
      data: template,
    };
  } catch (error) {
    console.log("error", error);
    return {
      result: false,
      isSuccess: false,
      hasMessage: "템플릿 생성 중 오류가 발생했습니다.",
      message: String(error),
    };
  }
};
