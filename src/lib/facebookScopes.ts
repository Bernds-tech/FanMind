export const FACEBOOK_PAGES_MESSAGING_SCOPE = "pages_messaging";
export const FACEBOOK_PAGES_READ_USER_CONTENT_SCOPE = "pages_read_user_content";
export const FACEBOOK_PAGES_MANAGE_ENGAGEMENT_SCOPE = "pages_manage_engagement";

export const FACEBOOK_COMMENT_FEED_SCOPES = [
  "pages_read_engagement",
  FACEBOOK_PAGES_READ_USER_CONTENT_SCOPE,
  FACEBOOK_PAGES_MANAGE_ENGAGEMENT_SCOPE,
] as const;

export const FACEBOOK_OAUTH_SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_metadata",
  FACEBOOK_PAGES_MESSAGING_SCOPE,
  FACEBOOK_PAGES_READ_USER_CONTENT_SCOPE,
  FACEBOOK_PAGES_MANAGE_ENGAGEMENT_SCOPE,
] as const;
