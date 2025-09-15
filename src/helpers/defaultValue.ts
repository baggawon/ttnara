import type {
  category,
  comment,
  general_setting,
  level_setting,
  thread_setting,
  tether_category,
  tether_proposal,
  tether_rate,
  thread,
  user_setting,
  topic,
} from "@prisma/client";
import type { TetherUpdateProps } from "@/app/api/tethers/update";
import Decimal from "decimal.js";
import {
  Currency,
  type Profile,
  TetherAddressTypes,
  TetherPriceTypes,
  TetherProposalMessengerTypes,
  TetherProposalStatus,
  TetherStatus,
  type Message,
  type UserForControl,
} from "@/helpers/types";
import type { RankCreateProps } from "@/app/api/admin_di2u3k2j/ranks/create";

export const userDefault = (data?: Partial<UserForControl>): UserForControl => {
  const created_at = new Date();
  return {
    id: "",
    username: "",
    created_at,
    updated_at: created_at,
    profile: profileDefault(data?.profile),
    ...data,
  };
};

export const profileDefault = (data?: Partial<Profile>): Profile => {
  return {
    displayname: "",
    point: 0,
    user_level: 0,
    auth_level: 0,
    ...data,
  };
};

export const messageDefault = (data?: Partial<Message>): Message => {
  const created_at = new Date();
  return {
    id: "",
    from_uid: "",
    to_uid: "",
    contents: "",
    is_read: false,
    created_at,
    ...data,
  };
};

export const threadDefault = (data?: Partial<thread>): thread => {
  const created_at = new Date();
  return {
    id: 0,
    title: "",
    content: "",
    author_id: "",
    topic_id: -1,
    topic_order: -1,
    category_id: null,
    created_at,
    updated_at: created_at,
    views: 0,
    upvotes: 0,
    downvotes: 0,
    is_secret: false,
    is_blocked: false,
    is_notice: false,
    ...data,
  };
};

export const generalDefault = (
  data?: Partial<general_setting>
): general_setting => {
  return {
    id: -1,
    site_name: "",
    site_description: "",
    maintenance_mode: false,
    allow_user_registration: true,
    allow_login: true,
    general_manager_id: null,
    user_logs_delete_days: 1,
    admin_logs_delete_days: 1,
    active_user_interval_seconds: 1,
    ...data,
  };
};

export const levelDefault = (data?: Partial<level_setting>): level_setting => {
  return {
    id: -1,
    max_system_level: 10,
    ...data,
  };
};

export const userSettingDefault = (
  data?: Partial<user_setting>
): user_setting => {
  return {
    id: -1,
    min_displayname_length: 4,
    max_displayname_length: 20,
    default_auth_level: 1,
    default_user_level: 1,
    user_delete_days: 0,
    ...data,
  };
};

export const threadSettingDefault = (
  data?: Partial<thread_setting>
): thread_setting => {
  return {
    id: 1,
    post_delete_days: 0,
    post_search_limit: 10000,
    post_interval_seconds: 0,
    max_thread_title_length: 200,
    max_thread_content_length: 10000,
    max_thread_comment_length: 300,
    min_thread_title_length: 1,
    min_thread_content_length: 1,
    min_thread_comment_length: 1,
    level_read: 0,
    level_create: 1,
    level_comment: 1,
    level_download: 1,
    level_moderator: 10,
    use_upload_file: false,
    allowed_file_extensions: "jpg,png,gif,webp,jpeg,mp4,webm",
    max_file_size_mb: 5,
    max_upload_items: 5,
    use_thumbnail: false,
    use_anonymous: false,
    use_upvote: true,
    use_downvote: false,
    thread_page_size: 20,
    thread_page_nav_size: 5,
    points_per_post_create: 0,
    points_per_post_read: 0,
    points_per_comment_create: 0,
    points_per_file_download: 0,
    points_per_upvote: 0,
    points_per_downvote: 0,
    thread_disable_edit: 0,
    thread_disable_delete: 0,
    default_topic_id: null,
    ...data,
  };
};

export const topicDefault = (data?: Partial<topic>): topic => {
  return {
    id: 0,
    name: "",
    url: "",
    description: null,
    display_order: 1,
    is_active: true,
    show_quickmenu: false,
    preview_on_homepage: false,
    fullview_on_homepage: false,
    single_comment_only: false,
    max_thread_title_length: 200,
    max_thread_content_length: 10000,
    max_thread_comment_length: 300,
    min_thread_title_length: 2,
    min_thread_content_length: 2,
    min_thread_comment_length: 2,
    level_read: 0,
    level_create: 1,
    level_comment: 1,
    level_download: 1,
    level_moderator: 10,
    use_upload_file: false,
    allowed_file_extensions: "jpg,png,gif,webp,jpeg,mp4,webm",
    max_file_size_mb: 5,
    max_upload_items: 5,
    use_thumbnail: false,
    use_anonymous: false,
    use_upvote: true,
    use_downvote: false,
    thread_page_size: 10,
    thread_page_nav_size: 5,
    points_per_post_create: 0,
    points_per_post_read: 0,
    points_per_comment_create: 0,
    points_per_file_download: 0,
    points_per_upvote: 0,
    points_per_downvote: 0,
    thread_disable_edit: 1,
    thread_disable_delete: 1,
    ...data,
  };
};

export const categoryDefault = (data?: Partial<category>): category => {
  return {
    id: 0,
    name: "",
    description: "",
    topic_id: 0,
    display_order: 1,
    is_active: true,
    ...data,
  };
};

export const commentDefault = (data?: Partial<comment>): comment => {
  const created_at = new Date();
  return {
    id: 0,
    thread_id: 0,
    author_id: "",
    content: "",
    created_at,
    updated_at: created_at,
    upvotes: 0,
    downvotes: 0,
    is_redacted: false,
    redacted_by_id: null,
    ...data,
  };
};

export const tetherDefault = (
  data?: Partial<TetherUpdateProps>
): TetherUpdateProps => {
  return {
    id: 0,
    user_id: "",
    title: "",
    condition: "",
    use_author: false,
    city: null,
    state: null,
    price: null,
    margin: null,
    min_qty: new Decimal(0),
    max_qty: new Decimal(0),
    password: "",
    methods: "",
    trade_type: "",
    currency: Currency.테더,
    status: TetherStatus.Open,
    price_type: TetherPriceTypes.Fixed,
    address_type: TetherAddressTypes.Category,
    custom_address: null,
    created_at: new Date(),
    updated_at: new Date(),
    user: null,
    tether_proposals: [],
    ...data,
  };
};

export const tetherCategoryDefault = (
  data?: Partial<tether_category>
): tether_category => {
  return {
    id: 0,
    name: "",
    parent_id: null,
    is_active: true,
    ...data,
  };
};

export const tetherProposalDefault = (
  data?: Partial<tether_proposal>
): tether_proposal => {
  const created_at = new Date();
  return {
    id: 0,
    created_at,
    updated_at: created_at,
    user_id: "",
    price: new Decimal(0),
    tether_id: 0,
    currency: Currency.테더,
    telegram_id: null,
    kakao_id: null,
    qty: new Decimal(0),
    reason: null,
    status: TetherProposalStatus.Open,
    messenger_type: TetherProposalMessengerTypes.Telegram,
    ...data,
  };
};

export const tetherRateDefault = (data?: Partial<tether_rate>): tether_rate => {
  return {
    id: 0,
    user_id: "",
    tether_proposal_id: 0,
    rate: new Decimal(0),
    created_at: new Date(),
    ...data,
  };
};

export const tradeRankCreateDefault = (
  data?: Partial<RankCreateProps>
): RankCreateProps => {
  return {
    name: "기본",
    rank_level: 1,
    min_trade_count: 0,
    description: null,
    badge_image: null,
    is_active: true,
    ...data,
  };
};
