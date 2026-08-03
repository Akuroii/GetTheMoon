export type ContentType = "video" | "stream" | "short";

export interface ContentItem {
  videoId: string;
  type: ContentType;
  title: string;
  thumbnailUrl: string;
  publishedAt: string; // ISO string
  viewCount: number;
  durationSeconds: number | null;
  url: string;
}

export interface ChannelStats {
  subscriberCount: number;
  totalViews: number;
  videoCount: number;
  avatarUrlYoutube: string | null;
  updatedAt: string;
}
