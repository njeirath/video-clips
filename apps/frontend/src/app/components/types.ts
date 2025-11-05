// Shared types for video clip components

export type VideoClip = {
  id: string;
  name: string;
  description?: string;
  videoUrl: string;
  shareUrl?: string;
  createdAt: string;
  thumbnailUrl?: string;
  blurhash?: string;
};
