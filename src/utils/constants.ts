import { StarterTemplate } from '../types';

export const STARTER_TEMPLATES: StarterTemplate[] = [
  {
    id: 'bold-editorial',
    name: 'Bold Editorial',
    description: 'Burgundy theme with gold accent and Neue Kabel editorial font for a premium look.',
    themeColor: '#3D1E22',
    accentColor: '#E6C280',
    fontStyle: 'editorial',
    brandName: 'THE HUB',
    niche: 'Entrepreneurship & Strategy',
    carouselSize: 'portrait',
    slides: [
      { id: 'cover', type: 'cover', headingText: 'How to Build a *High-Value* Audience' },
      { id: 'slide-1', type: 'keyword', keywords: ['NICHE'], headingText: 'The *Core* Problem', subText: 'Most creators target everyone. High-value audiences require *ultra-specific* positioning.' },
      { id: 'slide-2', type: 'keyword', keywords: ['DEPTH'], headingText: '*Depth* Beats Width', subText: 'A smaller, *high-intent* audience beats a massive, inactive following every single time.' },
      { id: 'reveal', type: 'reveal', headingText: 'Pro Tip: Share *raw case studies* and proprietary data that cannot be googled.' },
      { id: 'cta', type: 'cta', headingText: 'Get my *audience growth playbook* sent directly to your DMs', ctaLayout: 'likesave', triggerWord: 'GROWTH' }
    ]
  },
  {
    id: 'minimalist-tech',
    name: 'Minimalist Tech',
    description: 'Deep navy background with striking emerald green accents and clean monospaced layouts.',
    themeColor: '#0B0F19',
    accentColor: '#10B981',
    fontStyle: 'minimal',
    brandName: 'tech.dev',
    niche: 'Software Engineering',
    carouselSize: 'portrait',
    slides: [
      { id: 'cover', type: 'cover', headingText: 'Next.js 15 *Rendering Patterns*' },
      { id: 'slide-1', type: 'keyword', keywords: ['STATIC'], headingText: '*Static* Rendering (SSG)', subText: 'HTML is generated at build time and cached on the CDN for *superfast* delivery.' },
      { id: 'slide-2', type: 'keyword', keywords: ['DYNAMIC'], headingText: '*Dynamic* Rendering (SSR)', subText: 'HTML is rendered *on demand* on each HTTP request. Best for user-specific data.' },
      { id: 'reveal', type: 'reveal', headingText: 'Server Actions: Execute *server-side* database mutations directly inside components.' },
      { id: 'cta', type: 'cta', headingText: 'Want the NextJS *cheatsheet*? Comment below and we will send it!', ctaLayout: 'comment', triggerWord: 'NEXTJS' }
    ]
  },
  {
    id: 'creator-branding',
    name: 'Creative Branding',
    description: 'Vibrant violet canvas, rose pink highlights, and modern clean Gilroy typography.',
    themeColor: '#3B0764',
    accentColor: '#FB7185',
    fontStyle: 'modern',
    brandName: 'creative.studio',
    niche: 'Design & Aesthetics',
    carouselSize: 'square',
    slides: [
      { id: 'cover', type: 'cover', headingText: 'Stop Scroll: 3 *Design Secrets*' },
      { id: 'slide-1', type: 'keyword', keywords: ['CONTRAST'], headingText: 'Extreme *High Contrast*', subText: 'Leverage highly contrasting background and foreground tints to *capture* immediate attention.' },
      { id: 'slide-2', type: 'keyword', keywords: ['GRADIENTS'], headingText: 'Fluid *Color Gradients*', subText: 'Use clean, multi-stop brand gradient overlays to add *depth* and quality to plain shapes.' },
      { id: 'reveal', type: 'reveal', headingText: 'Rule: Design for *mobile first*. Keep margins large and texts highly readable.' },
      { id: 'cta', type: 'cta', headingText: 'DM me *DESIGN* to access our library of 50+ free design assets', ctaLayout: 'all', triggerWord: 'DESIGN' }
    ]
  }
];
