import {
  RequestValidator,
  requestValidator,
} from "@/helpers/server/serverFunctions";
import { ToastData } from "@/helpers/toastData";
import { handleConnect } from "@/helpers/server/prisma";
import { appCache, CacheKey } from "@/helpers/server/serverCache";
import { uploadFileToS3, deleteFileFromS3 } from "@/helpers/server/s3";
import type { popup } from "@prisma/client";

export interface PopupUpdateProps extends popup {
  image_file?: File;
  remove_image?: string;
}

export const POST = async (formData: FormData) => {
  await requestValidator([RequestValidator.Admin], formData);
  try {
    const json: PopupUpdateProps = {
      id: parseInt(formData.get("id") as string),
      title: formData.get("title") as string,
      content: formData.get("content") as string,
      image_cloud_front_url: null, // will be set later
      image_aws_url: null, // will be set later
      link_url: formData.get("link_url") as string,
      link_target: formData.get("link_target") as string,
      position: formData.get("position") as string,
      width: parseInt(formData.get("width") as string),
      height: parseInt(formData.get("height") as string),
      start_date: new Date(formData.get("start_date") as string),
      end_date: new Date(formData.get("end_date") as string),
      is_active: formData.get("is_active") === "true",
      show_on_mobile: formData.get("show_on_mobile") === "true",
      show_on_desktop: formData.get("show_on_desktop") === "true",
      cookie_days: parseInt(formData.get("cookie_days") as string),
      show_hide_option: formData.get("show_hide_option") === "true",
      display_order: parseInt(formData.get("display_order") as string),
      created_at: new Date(), // will be ignored in update
      updated_at: new Date(),
      image_file: formData.get("image_file") as File,
      remove_image: formData.get("remove_image") as string,
    };

    if (!json.id) throw ToastData.unknown;

    const existingPopup = await handleConnect((prisma) =>
      prisma.popup.findUnique({
        where: { id: json.id },
      })
    );

    if (!existingPopup) throw ToastData.unknown;

    // 기존 이미지 URL 설정
    json.image_cloud_front_url = existingPopup.image_cloud_front_url;
    json.image_aws_url = existingPopup.image_aws_url;

    // 이미지 삭제 요청
    if (json.remove_image === "true") {
      if (existingPopup.image_cloud_front_url) {
        await deleteFileFromS3(existingPopup.image_cloud_front_url);
      }
      json.image_cloud_front_url = null;
      json.image_aws_url = null;
    }
    // 새 이미지 업로드
    else if (json.image_file && json.image_file.size > 0) {
      // 기존 이미지가 있으면 삭제 (cloud_front_url 우선 사용)
      if (existingPopup.image_cloud_front_url) {
        await deleteFileFromS3(existingPopup.image_cloud_front_url);
      }

      const uploadResult = await uploadFileToS3(json.image_file, "popup");
      if (uploadResult?.aws_cloud_front_url && uploadResult?.aws_url) {
        json.image_cloud_front_url = uploadResult.aws_cloud_front_url;
        json.image_aws_url = uploadResult.aws_url;
      }
    }

    const popup = await handleConnect((prisma) =>
      prisma.popup.update({
        where: { id: json.id },
        data: {
          title: json.title,
          content: json.content,
          link_url: json.link_url || null,
          link_target: json.link_target,
          position: json.position,
          width: json.width,
          height: json.height,
          start_date: json.start_date,
          end_date: json.end_date,
          is_active: json.is_active,
          show_on_mobile: json.show_on_mobile,
          show_on_desktop: json.show_on_desktop,
          cookie_days: json.cookie_days,
          show_hide_option: json.show_hide_option,
          display_order: json.display_order,
          image_cloud_front_url: json.image_cloud_front_url,
          image_aws_url: json.image_aws_url,
        },
      })
    );

    if (!popup) throw ToastData.unknown;

    await appCache.refreshCache(CacheKey.Popups);

    return {
      result: true,
      isSuccess: true,
      hasMessage: "팝업이 성공적으로 수정되었습니다.",
      data: popup,
    };
  } catch (error) {
    console.log("error", error);
    return {
      result: false,
      isSuccess: false,
      hasMessage: "팝업 수정 중 오류가 발생했습니다.",
      message: String(error),
    };
  }
};
