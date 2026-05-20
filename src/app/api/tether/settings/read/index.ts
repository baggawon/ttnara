import { appCache, CacheKey } from "@/helpers/server/serverCache";
import { ToastData } from "@/helpers/toastData";
import type { tether_setting } from "@prisma/client";

export interface TetherPublicSettings {
  use_tether_board: boolean;
  min_thread_title_length: number;
  max_thread_title_length: number;
  min_thread_content_length: number;
  max_thread_content_length: number;
  use_upload_file: boolean;
  allowed_file_extensions: string;
  max_file_size_mb: number;
  max_upload_items: number;
}

export const GET = async () => {
  try {
    const settings = appCache.getByKey(CacheKey.TetherSettings) as
      | tether_setting
      | undefined;
    if (!settings) throw ToastData.unknown;

    const data: TetherPublicSettings = {
      use_tether_board: settings.use_tether_board,
      min_thread_title_length: settings.min_thread_title_length,
      max_thread_title_length: settings.max_thread_title_length,
      min_thread_content_length: settings.min_thread_content_length,
      max_thread_content_length: settings.max_thread_content_length,
      use_upload_file: settings.use_upload_file,
      allowed_file_extensions: settings.allowed_file_extensions,
      max_file_size_mb: settings.max_file_size_mb,
      max_upload_items: settings.max_upload_items,
    };

    return { result: true, data };
  } catch (error) {
    return {
      result: false,
      message: String(error),
    };
  }
};
