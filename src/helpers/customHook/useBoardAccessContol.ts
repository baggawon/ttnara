"use client";

import type { ThreadWithProfile } from "@/app/api/threads/read";
import { type UserAndSettings, QueryKey } from "@/helpers/types";
import { sessionGet, userGet } from "@/helpers/get";
import type { Session } from "next-auth";

import useGetQuery from "@/helpers/customHook/useGetQuery";
import { useEffect, useState } from "react";
import type { TopicSettings } from "@/app/api/topic/read";

interface BoardAccessControl {
  // Content length controls
  isActive: boolean;
  titleLength: {
    max: number;
    min: number;
  };
  contentLength: {
    max: number;
    min: number;
  };
  commentLength: {
    max: number;
    min: number;
  };

  // Permission controls
  permissions: {
    canRead: boolean;
    canWrite: boolean;
    canEdit: boolean;
    canComment: boolean;
    canDownload: boolean;
    canModerate: boolean;
  };

  // File upload controls
  fileUpload: {
    enabled: boolean;
    maxItems: number;
    maxSizeMB: number;
    allowedExtensions: string[];
  };

  // Feature toggles
  features: {
    anonymous: boolean;
    upvote: boolean;
    downvote: boolean;
    thumbnail: boolean;
    singleCommentOnly: boolean;
  };

  // Pagination settings
  pagination: {
    pageSize: number;
    navSize: number;
  };

  // Post modification controls
  postControls: {
    maxCommentsBeforeEditLock: number;
    maxCommentsBeforeDeleteLock: number;
  };

  // Point system
  points: {
    create: number;
    read: number;
    comment: number;
    download: number;
    upvote: number;
    downvote: number;
  };
}

const useBoardAccessControl = ({
  topicSettings,
  currentThread,
}: {
  topicSettings: TopicSettings | null;
  currentThread?: ThreadWithProfile | null;
}) => {
  // Create a default access control with proper fallbacks for unauthenticated users
  const createDefaultAccessControl = (): BoardAccessControl | null => {
    if (!topicSettings) return null;

    return {
      isActive: topicSettings?.is_active ?? false,
      titleLength: {
        max: topicSettings?.max_thread_title_length ?? 200,
        min: topicSettings?.min_thread_title_length ?? 1,
      },
      contentLength: {
        max: topicSettings?.max_thread_content_length ?? 10000,
        min: topicSettings?.min_thread_content_length ?? 1,
      },
      commentLength: {
        max: topicSettings?.max_thread_comment_length ?? 5000,
        min: topicSettings?.min_thread_comment_length ?? 1,
      },
      permissions: {
        canRead: true, // Allow reading by default
        canWrite: false,
        canEdit: false,
        canComment: false,
        canDownload: false,
        canModerate: false,
      },
      fileUpload: {
        enabled: topicSettings?.use_upload_file ?? false,
        maxItems: topicSettings?.max_upload_items ?? 5,
        maxSizeMB: topicSettings?.max_file_size_mb ?? 5,
        allowedExtensions: topicSettings?.allowed_file_extensions?.split(
          ","
        ) ?? ["jpg", "png", "gif", "webp", "jpeg", "mp4", "webm"],
      },
      features: {
        thumbnail: topicSettings?.use_thumbnail ?? false,
        anonymous: topicSettings?.use_anonymous ?? false,
        upvote: topicSettings?.use_upvote ?? true,
        downvote: topicSettings?.use_downvote ?? false,
        singleCommentOnly: topicSettings?.single_comment_only ?? false,
      },
      pagination: {
        pageSize: topicSettings?.thread_page_size ?? 20,
        navSize: topicSettings?.thread_page_nav_size ?? 5,
      },
      postControls: {
        maxCommentsBeforeEditLock: topicSettings?.thread_disable_edit ?? 0,
        maxCommentsBeforeDeleteLock: topicSettings?.thread_disable_delete ?? 0,
      },
      points: {
        create: topicSettings?.points_per_post_create ?? 0,
        read: topicSettings?.points_per_post_read ?? 0,
        comment: topicSettings?.points_per_comment_create ?? 0,
        download: topicSettings?.points_per_file_download ?? 0,
        upvote: topicSettings?.points_per_upvote ?? 0,
        downvote: topicSettings?.points_per_downvote ?? 0,
      },
    };
  };

  const defaultAccessControl = createDefaultAccessControl();
  const [accessControl, setAccessControl] = useState<BoardAccessControl | null>(
    defaultAccessControl
  );

  // Always call hooks at the top level, regardless of conditions
  const { data: session } = useGetQuery<Session | null | undefined, undefined>(
    {
      queryKey: [QueryKey.session],
      enabled: !!topicSettings,
      // Prevent query errors from bubbling up
      retry: false,
      throwOnError: false,
    },
    sessionGet
  );

  // Only attempt to get user data if we have a session
  const { data: userData } = useGetQuery<UserAndSettings, undefined>(
    {
      queryKey: [QueryKey.account],
      enabled: !!session?.user,
      // Prevent query errors from bubbling up
      retry: false,
      throwOnError: false,
    },
    userGet
  );

  // Update permissions whenever session, userData, or topic changes
  useEffect(() => {
    if (!topicSettings || !defaultAccessControl) return;

    try {
      // Only update permissions if we have session and user data
      if (session?.user && userData) {
        const userAuthLevel = userData?.profile?.auth_level ?? 0;
        const userIsAppAdmin = userData?.profile?.is_app_admin ?? false;
        const levelRead = topicSettings?.level_read ?? 0;
        const levelCreate = topicSettings?.level_create ?? 1;
        const levelComment = topicSettings?.level_comment ?? 1;
        const levelDownload = topicSettings?.level_download ?? 1;
        const levelModerator = topicSettings?.level_moderator ?? 10;

        setAccessControl({
          ...defaultAccessControl,
          permissions: {
            canRead: userIsAppAdmin || userAuthLevel >= levelRead,
            canWrite: userIsAppAdmin || userAuthLevel >= levelCreate,
            canEdit: currentThread
              ? userIsAppAdmin || userData?.id === currentThread.author_id
              : false,
            canComment: userIsAppAdmin || userAuthLevel >= levelComment,
            canDownload: userIsAppAdmin || userAuthLevel >= levelDownload,
            canModerate: userIsAppAdmin || userAuthLevel >= levelModerator,
          },
        });
      }
    } catch (error) {
      console.error("Error in board access control:", error);
    }
  }, [session, userData, currentThread, topicSettings, defaultAccessControl]);

  return accessControl;
};

export default useBoardAccessControl;
