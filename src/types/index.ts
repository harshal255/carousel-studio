export interface ImageFile {
  id: string;
  url: string; // Base64 data URL
  file: File;
  name?: string;
}

export interface Slide {
  id: string;
  type: 'cover' | 'keyword' | 'reveal' | 'cta';
  keywords?: string[];
  imageUrl?: string;
  imageZoom?: number;
  imagePanX?: number;
  imagePanY?: number;
  imageRotate?: number;
  imageFlipH?: boolean;
  imageFlipV?: boolean;
  headingText?: string;
  subText?: string;
  triggerWord?: string;
  ctaLayout?: 'comment' | 'likesave' | 'sharesave' | 'all';
}

export interface HookSuggestion {
  angle: string;
  hook: string;
}

export interface SavedDraft {
  id: string;
  timestamp: number;
  name: string;
  slideCount: number;
  thumbnailUrl?: string;
  state: any;
}

export interface StarterTemplate {
  id: string;
  name: string;
  description: string;
  themeColor: string;
  accentColor: string;
  fontStyle: string;
  brandName: string;
  niche: string;
  carouselSize: 'portrait' | 'square';
  slides: Slide[];
}
