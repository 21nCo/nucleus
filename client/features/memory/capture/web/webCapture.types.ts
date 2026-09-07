export type WebArtifactCategory =
  | "MOVIES"
  | "BOOKS"
  | "PODCASTS"
  | "RECIPES"
  | "VIDEOS"
  | "ARTICLES";

export interface WebArtifactProvider {
  id: string;
  name: string;
  url?: string;
}

export interface WebArtifact {
  id: string;
  category: WebArtifactCategory;
  title: string;
  subtitle?: string;
  description?: string;
  externalUrl?: string;
  thumbnailUrl?: string;
  tags?: string[];
  rating?: number;
  ratingScale?: number;
  durationMinutes?: number;
  releaseDate?: string;
  providers?: WebArtifactProvider[];
  raw?: Record<string, unknown>;
}

export interface WebArtifactSearchResult {
  items: WebArtifact[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
