import { prisma } from "@/helpers/server/prismaClient";
import type { Session } from "next-auth";

interface BoardAccessParams {
  userId: string;
  topic_url: string;
  thread_id?: number;
  isAppAdmin?: boolean;
  userAuthLevel?: number;
  thread?: any; // Replace with your thread type
  topicSettings?: any; // Replace with your topic settings type
}

export class BoardAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BoardAccessError";
  }
}

export class BoardAccessService {
  private userId: string;
  private topic_url: string;
  private isAppAdmin: boolean;
  private userAuthLevel: number;
  private topicSettings: any; // Replace with your topic settings type
  private thread_id?: number;
  private thread: any;

  constructor({
    userId,
    topic_url,
    thread_id,
    isAppAdmin = false,
    userAuthLevel = 0,
    thread,
    topicSettings,
  }: BoardAccessParams) {
    this.userId = userId;
    this.topic_url = topic_url;
    this.thread_id = thread_id;
    this.isAppAdmin = isAppAdmin;
    this.userAuthLevel = userAuthLevel;
    if (thread) {
      this.thread = thread;
    }
    if (topicSettings) {
      this.topicSettings = topicSettings;
    }
  }

  // Initialize with topic settings
  async initialize() {
    if (!this.topicSettings) {
      this.topicSettings = await prisma.topic.findUnique({
        where: { url: this.topic_url },
      });

      if (!this.topicSettings) {
        throw new BoardAccessError("NOT_FOUND");
      }
    }

    if (
      typeof this.thread_id === "number" &&
      this.thread_id > 0 &&
      !this.thread
    ) {
      this.thread = await prisma.thread.findUnique({
        where: { id: this.thread_id },
      });
    }

    return this;
  }

  isActive() {
    return this.topicSettings?.is_active ?? false;
  }

  // Permission checks
  canRead() {
    return (
      this.isAppAdmin ||
      this.userAuthLevel >= (this.topicSettings?.level_read ?? 0)
    );
  }

  canEdit() {
    if (this.thread_id && this.thread_id > 0) {
      return this.isAppAdmin || this.userId === this.thread?.author_id;
    }
    return false;
  }

  canWrite() {
    return (
      this.isAppAdmin ||
      this.userAuthLevel >= (this.topicSettings?.level_create ?? 1)
    );
  }

  canComment() {
    if (this.thread_id && this.thread_id > 0) {
      return (
        this.isAppAdmin ||
        this.userAuthLevel >= (this.topicSettings?.level_comment ?? 1)
      );
    }
    return false;
  }

  canDelete() {
    if (this.thread_id && this.thread_id > 0) {
      return this.isAppAdmin || this.userId === this.thread?.author_id;
    }
    return false;
  }

  canModerate() {
    return (
      this.isAppAdmin ||
      this.userAuthLevel >= (this.topicSettings?.level_moderate ?? 0)
    );
  }

  // Content validation
  validateTitle(title: string) {
    const max = this.topicSettings?.max_thread_title_length ?? 200;
    const min = this.topicSettings?.min_thread_title_length ?? 1;
    return title.length >= min && title.length <= max;
  }

  validateContent(content: string) {
    const max = this.topicSettings?.max_thread_content_length ?? 10000;
    const min = this.topicSettings?.min_thread_content_length ?? 3;

    // Remove non-text elements completely (img, video, iframe, etc.)
    const contentWithoutMedia = content.replace(
      /<(img|video|iframe)[^>]*>/g,
      ""
    );

    // Then check if there's any actual text content
    const hasText =
      contentWithoutMedia
        .replace(/<[^>]*>/g, "") // Remove remaining HTML tags
        .trim().length > 0;

    if (!hasText) {
      return false;
    }

    // For length validation, we'll count only actual text
    const textLength = contentWithoutMedia
      .replace(/<[^>]*>/g, "") // Remove HTML tags
      .replace(/&nbsp;|&amp;|&lt;|&gt;|&quot;/g, "x") // Replace HTML entities
      .trim().length;

    return textLength >= min && textLength <= max;
  }

  validateComment(content: string) {
    const max = this.topicSettings?.max_comment_content_length ?? 300;
    const min = this.topicSettings?.min_comment_content_length ?? 1;
    return content.length >= min && content.length <= max;
  }

  // Feature checks
  canUploadFiles() {
    return this.topicSettings?.use_upload_file ?? false;
  }

  getFileUploadLimits() {
    return {
      maxItems: this.topicSettings?.max_upload_items ?? 5,
      maxSizeMB: this.topicSettings?.max_file_size_mb ?? 5,
      allowedExtensions:
        this.topicSettings?.allowed_file_extensions?.split(",") ?? [],
    };
  }

  // Static helper to create from session
  static async fromSession({
    session,
    topic_url,
    thread_id,
    thread,
    topicSettings,
  }: {
    session: Session | null;
    topic_url: string;
    thread_id?: number;
    thread?: any; // Replace with your thread type
    topicSettings?: any; // Replace with your topic settings type
  }) {
    // Handle anonymous access
    if (!session?.user) {
      return new BoardAccessService({
        userId: "anonymous",
        topic_url,
        thread_id: thread_id ?? 0,
        isAppAdmin: false,
        userAuthLevel: 0,
        thread,
        topicSettings,
      }).initialize();
    }

    const user = session.user;
    return new BoardAccessService({
      userId: user.id,
      topic_url,
      thread_id: thread_id ?? 0,
      isAppAdmin: user.is_app_admin ?? false,
      userAuthLevel: user.auth_level ?? 0,
      thread,
      topicSettings,
    }).initialize();
  }
}

// Usage in API route
// export async function POST(request: Request) {
//   const session = await getServerSession();
//   const { topicName, title, content } = await request.json();

//   try {
//     const access = await BoardAccessService.fromSession(session, topicName);

//     if (!access.canWrite()) {
//       return new Response("Forbidden", { status: 403 });
//     }

//     if (!access.validateTitle(title)) {
//       return new Response("Invalid title length", { status: 400 });
//     }

//     // Continue with creating thread...
//   } catch (error) {
//     return new Response("Error", { status: 500 });
//   }
// }

// Usage in Server Component
// export default async function ThreadPage({ topicName }: { topicName: string }) {
//   const session = await getServerSession();
//   const access = await BoardAccessService.fromSession(session, topicName);

//   if (!access.canRead()) {
//     redirect("/login");
//   }

// Render page...
// }
