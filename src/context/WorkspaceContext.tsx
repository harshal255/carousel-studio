import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Slide, ImageFile, SavedDraft, StarterTemplate, HookSuggestion } from '../types';
import { draftDb } from '../db/draftDb';
import { STARTER_TEMPLATES } from '../utils/constants';

interface WorkspaceContextType {
  view: 'dashboard' | 'editor';
  setView: (v: 'dashboard' | 'editor') => void;
  brandName: string;
  setBrandName: (v: string) => void;
  niche: string;
  setNiche: (v: string) => void;
  accentColor: string;
  setAccentColor: (v: string) => void;
  suggestedPalette: string[];
  setSuggestedPalette: (v: string[]) => void;
  fontStyle: string;
  setFontStyle: (v: string) => void;
  fontDropdownOpen: boolean;
  setFontDropdownOpen: (v: boolean) => void;
  customFonts: Array<{ id: string; name: string }>;
  setCustomFonts: React.Dispatch<React.SetStateAction<Array<{ id: string; name: string }>>>;
  images: ImageFile[];
  setImages: React.Dispatch<React.SetStateAction<ImageFile[]>>;
  logoUrl: string | null;
  setLogoUrl: (v: string | null) => void;
  logoMode: 'text' | 'logo' | 'both';
  setLogoMode: (v: 'text' | 'logo' | 'both') => void;
  logoWidth: number;
  setLogoWidth: (v: number) => void;
  logoOpacity: number;
  setLogoOpacity: (v: number) => void;
  slides: Slide[];
  setSlides: React.Dispatch<React.SetStateAction<Slide[]>>;
  currentSlide: number;
  setCurrentSlide: (v: number) => void;
  aiPrompt: string;
  setAiPrompt: (v: string) => void;
  topic: string;
  setTopic: (v: string) => void;
  selectedHookText: string;
  setSelectedHookText: (v: string) => void;
  suggestedHooks: HookSuggestion[];
  setSuggestedHooks: (v: HookSuggestion[]) => void;
  isGeneratingHooks: boolean;
  setIsGeneratingHooks: (v: boolean) => void;
  chatRevision: string;
  setChatRevision: (v: string) => void;
  outsideContent: string;
  setOutsideContent: (v: string) => void;
  showOutsideImport: boolean;
  setShowOutsideImport: (v: boolean) => void;
  generatedCaption: string;
  setGeneratedCaption: (v: string) => void;
  activeTab: 'preview' | 'caption';
  setActiveTab: (v: 'preview' | 'caption') => void;
  viewMode: 'single' | 'swipe';
  setViewMode: (v: 'single' | 'swipe') => void;
  aiTool: string;
  setAiTool: (v: string) => void;
  carouselSize: 'portrait' | 'square';
  setCarouselSize: (v: 'portrait' | 'square') => void;
  draftsModalOpen: boolean;
  setDraftsModalOpen: (v: boolean) => void;
  savedDraftsList: SavedDraft[];
  setSavedDraftsList: React.Dispatch<React.SetStateAction<SavedDraft[]>>;
  bottomPadding: number;
  setBottomPadding: (v: number) => void;
  showWordmark: boolean;
  setShowWordmark: (v: boolean) => void;
  showCoverSlide: boolean;
  setShowCoverSlide: (v: boolean) => void;
  showRevealSlide: boolean;
  setShowRevealSlide: (v: boolean) => void;
  coverHeading: string;
  setCoverHeading: (v: string) => void;
  gradientHeight: number;
  setGradientHeight: (v: number) => void;
  fontSize: number;
  setFontSize: (v: number) => void;
  isDownloading: boolean;
  setIsDownloading: (v: boolean) => void;
  downloadProgress: string;
  setDownloadProgress: (v: string) => void;
  loadSavedDraftsList: () => Promise<void>;
  loadStarterTemplate: (template: StarterTemplate) => void;
  getHeadingFont: () => string;
  getBodyFont: () => string;
  handleSaveDraftSnapshot: () => Promise<void>;
  handleLoadDraftSnapshot: (draft: SavedDraft) => Promise<void>;
  handleDeleteDraftSnapshot: (id: string, name: string) => Promise<void>;
  handleStartFreshWorkspace: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [view, setView] = useState<'dashboard' | 'editor'>('dashboard');
  const [brandName, setBrandName] = useState('prompts.page');
  const [niche, setNiche] = useState('AI Creative Studio');
  const [accentColor, setAccentColor] = useState('#C8A97E');
  const [suggestedPalette, setSuggestedPalette] = useState<string[]>([]);
  const [fontStyle, setFontStyle] = useState('editorial');
  const [fontDropdownOpen, setFontDropdownOpen] = useState(false);
  const [customFonts, setCustomFonts] = useState<Array<{ id: string; name: string }>>([]);
  const [images, setImages] = useState<ImageFile[]>([]);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoMode, setLogoMode] = useState<'text' | 'logo' | 'both'>('text');
  const [logoWidth, setLogoWidth] = useState<number>(24);
  const [logoOpacity, setLogoOpacity] = useState<number>(100);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [aiPrompt, setAiPrompt] = useState('');
  const [topic, setTopic] = useState('');
  const [selectedHookText, setSelectedHookText] = useState('');
  const [suggestedHooks, setSuggestedHooks] = useState<HookSuggestion[]>([]);
  const [isGeneratingHooks, setIsGeneratingHooks] = useState(false);
  const [chatRevision, setChatRevision] = useState('');
  const [outsideContent, setOutsideContent] = useState('');
  const [showOutsideImport, setShowOutsideImport] = useState(false);
  const [generatedCaption, setGeneratedCaption] = useState('');
  const [activeTab, setActiveTab] = useState<'preview' | 'caption'>('preview');
  const [viewMode, setViewMode] = useState<'single' | 'swipe'>('single');
  const [aiTool, setAiTool] = useState('ChatGPT Images 2.0');
  const [carouselSize, setCarouselSize] = useState<'portrait' | 'square'>('portrait');
  const [draftsModalOpen, setDraftsModalOpen] = useState(false);
  const [savedDraftsList, setSavedDraftsList] = useState<SavedDraft[]>([]);
  const [bottomPadding, setBottomPadding] = useState(5);
  const [showWordmark, setShowWordmark] = useState(true);
  const [showCoverSlide, setShowCoverSlide] = useState(true);
  const [showRevealSlide, setShowRevealSlide] = useState(true);
  const [coverHeading, setCoverHeading] = useState('5 Secret Lighting Prompts');
  const [gradientHeight, setGradientHeight] = useState(75);
  const [fontSize, setFontSize] = useState(25);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState('');

  const getHeadingFont = () => {
    const custom = customFonts.find(f => `custom-${f.id}` === fontStyle);
    if (custom) return `"${custom.name}", sans-serif`;
    if (fontStyle === 'modern') return 'GilroyBold, sans-serif';
    if (fontStyle === 'editorial') return 'NeueKabelBold, sans-serif';
    return 'Drowner, sans-serif';
  };

  const getBodyFont = () => {
    const custom = customFonts.find(f => `custom-${f.id}` === fontStyle);
    if (custom) return `"${custom.name}", sans-serif`;
    if (fontStyle === 'modern') return 'GilroyLight, sans-serif';
    if (fontStyle === 'editorial') return 'NeueKabelLight, sans-serif';
    return 'PTMonoRegular, sans-serif';
  };

  const loadSavedDraftsList = async () => {
    try {
      const list = await draftDb.getSavedDrafts();
      setSavedDraftsList(list);
    } catch (e) {
      console.error('Failed to load saved drafts:', e);
    }
  };

  const loadStarterTemplate = (template: StarterTemplate) => {
    setBrandName(template.brandName);
    setNiche(template.niche);
    setAccentColor(template.accentColor);
    setFontStyle(template.fontStyle);
    setImages([]);
    setSlides(template.slides);
    setCurrentSlide(0);
    setCarouselSize(template.carouselSize);

    setGradientHeight(75);
    setFontSize(25);
    setBottomPadding(5);
    setShowWordmark(true);
    setShowCoverSlide(true);
    setShowRevealSlide(template.slides.some(s => s.type === 'reveal'));
    setCoverHeading(template.slides.find(s => s.type === 'cover')?.headingText ?? '');
    setAiPrompt(template.slides.find(s => s.type === 'reveal')?.headingText ?? '');

    setTopic('');
    setSelectedHookText('');
    setSuggestedHooks([]);
    setGeneratedCaption('');
  };

  // Restore state from IndexedDB active_draft & load saved drafts on mount
  useEffect(() => {
    const restoreState = async () => {
      try {
        const saved = await draftDb.getActive();
        if (saved && saved.slides && saved.slides.length > 0) {
          setBrandName(saved.brandName ?? '');
          setNiche(saved.niche ?? '');
          setAccentColor(saved.accentColor ?? '#C8A97E');
          setFontStyle(saved.fontStyle ?? 'editorial');
          if (saved.images) {
            setImages(saved.images.map((img: any) => ({
              id: img.id || Math.random().toString(),
              url: img.url,
              name: img.name || '',
              file: null as any
            })));
          }
          setSlides(saved.slides ?? []);
          setCurrentSlide(saved.currentSlide ?? 0);
          setCarouselSize(saved.carouselSize ?? 'portrait');
          setGradientHeight(saved.gradientHeight ?? 75);
          setFontSize(saved.fontSize ?? 25);
          setBottomPadding(saved.bottomPadding ?? 5);
          setShowWordmark(saved.showWordmark ?? true);
          setShowCoverSlide(saved.showCoverSlide ?? true);
          setShowRevealSlide(saved.showRevealSlide ?? true);
          setCoverHeading(saved.coverHeading ?? '');
          setAiPrompt(saved.aiPrompt ?? '');
          setLogoUrl(saved.logoUrl ?? null);
          setLogoMode(saved.logoMode ?? 'text');
          setLogoWidth(saved.logoWidth ?? 24);
          setLogoOpacity(saved.logoOpacity ?? 100);
        } else {
          loadStarterTemplate(STARTER_TEMPLATES[0]);
        }
      } catch (e) {
        console.warn('Failed to restore active draft state', e);
        loadStarterTemplate(STARTER_TEMPLATES[0]);
      }
    };
    restoreState();
    loadSavedDraftsList();
  }, []);

  // Autosave active state to IndexedDB active_draft
  useEffect(() => {
    const saveActiveState = async () => {
      if (slides.length === 0) return;
      try {
        const stateToSave = {
          brandName,
          niche,
          accentColor,
          fontStyle,
          images: images.map(img => ({ id: img.id, url: img.url, name: img.name || img.file?.name })),
          slides,
          currentSlide,
          carouselSize,
          gradientHeight,
          fontSize,
          bottomPadding,
          showWordmark,
          showCoverSlide,
          showRevealSlide,
          coverHeading,
          aiPrompt,
          logoUrl,
          logoMode,
          logoWidth,
          logoOpacity
        };
        await draftDb.saveActive(stateToSave);
      } catch (e) {
        console.warn('Autosave failed:', e);
      }
    };
    saveActiveState();
  }, [
    brandName,
    niche,
    accentColor,
    fontStyle,
    images,
    slides,
    currentSlide,
    carouselSize,
    gradientHeight,
    fontSize,
    bottomPadding,
    showWordmark,
    showCoverSlide,
    showRevealSlide,
    coverHeading,
    aiPrompt,
    logoUrl,
    logoMode,
    logoWidth,
      ]);

  const handleSaveDraftSnapshot = async () => {
    if (slides.length === 0) {
      toast.error('Cannot save an empty workspace draft.');
      return;
    }

    const id = Date.now().toString();
    const timestamp = Date.now();
    const name = topic.trim()
      ? `Draft: ${topic.slice(0, 25)}${topic.length > 25 ? '...' : ''}`
      : `Draft: ${brandName} (${slides.length} slides)`;

    const thumbnailUrl = images[0]?.url || undefined;

    const stateToSave = {
      brandName,
      niche,
      accentColor,
      fontStyle,
      images: images.map(img => ({ id: img.id, url: img.url, name: img.name || img.file?.name })),
      slides,
      currentSlide,
      gradientHeight,
      fontSize,
      bottomPadding,
      showWordmark,
      showCoverSlide,
      showRevealSlide,
      coverHeading,
      aiPrompt,
      topic,
      selectedHookText,
      suggestedHooks,
      generatedCaption,
      viewMode,
      carouselSize,
      logoUrl,
      logoMode,
      logoWidth,
      logoOpacity
    };

    const draft: SavedDraft = {
      id,
      timestamp,
      name,
      slideCount: slides.length,
      thumbnailUrl,
      state: stateToSave
    };

    try {
      await draftDb.saveDraft(draft);
      toast.success('Project draft saved successfully!');
      loadSavedDraftsList();
    } catch (err) {
      console.error('Failed to save draft snapshot:', err);
      toast.error('Failed to save draft.');
    }
  };

  const handleLoadDraftSnapshot = async (draft: SavedDraft) => {
    const saved = draft.state;
    if (!saved) return;

    try {
      setBrandName(saved.brandName ?? '');
      setNiche(saved.niche ?? '');
      setAccentColor(saved.accentColor ?? '#C8A97E');
      setFontStyle(saved.fontStyle ?? 'editorial');
      if (saved.images) {
        setImages(saved.images.map((img: any) => ({
          id: img.id,
          url: img.url,
          name: img.name || '',
          file: new File([], img.name || 'restored_image.jpg')
        })));
      }
      setSlides(saved.slides);
      setCurrentSlide(saved.currentSlide ?? 0);
      setGradientHeight(saved.gradientHeight ?? 75);
      setFontSize(saved.fontSize ?? 25);
      setBottomPadding(saved.bottomPadding ?? 5);
      setShowWordmark(saved.showWordmark ?? true);
      setShowCoverSlide(saved.showCoverSlide ?? true);
      setShowRevealSlide(saved.showRevealSlide ?? true);
      setCoverHeading(saved.coverHeading ?? '');
      setAiPrompt(saved.aiPrompt ?? '');
      setTopic(saved.topic ?? '');
      setSelectedHookText(saved.selectedHookText ?? '');
      setSuggestedHooks(saved.suggestedHooks ?? []);
      setGeneratedCaption(saved.generatedCaption ?? '');
      setViewMode(saved.viewMode ?? 'single');
      setCarouselSize(saved.carouselSize ?? 'portrait');
      setLogoUrl(saved.logoUrl ?? null);
      setLogoMode(saved.logoMode ?? 'text');
      setLogoWidth(saved.logoWidth ?? 24);
      setLogoOpacity(saved.logoOpacity ?? 100);

      await draftDb.saveActive(saved);
      toast.success(`Draft "${draft.name}" loaded!`);
      setDraftsModalOpen(false);
    } catch (err) {
      console.error('Failed to load draft:', err);
      toast.error('Failed to load draft.');
    }
  };

  const handleDeleteDraftSnapshot = async (id: string, name: string) => {
    try {
      await draftDb.deleteDraft(id);
      toast.success(`Draft "${name}" deleted.`);
      loadSavedDraftsList();
    } catch (err) {
      console.error('Failed to delete draft:', err);
      toast.error('Failed to delete draft.');
    }
  };

  const handleStartFreshWorkspace = async () => {
    if (!confirm('Are you sure you want to clear the workspace and start fresh? All unsaved work will be lost.')) {
      return;
    }

    try {
      await draftDb.clearActive();

      setBrandName('prompts.page');
      setNiche('AI Creative Studio');
      setAccentColor('#C8A97E');
      setFontStyle('editorial');
      setImages([]);
      setSlides([]);
      setCurrentSlide(0);
      setCoverHeading('5 Secret Lighting Prompts');
      setAiPrompt('');
      setTopic('');
      setSelectedHookText('');
      setSuggestedHooks([]);
      setGeneratedCaption('');
      setViewMode('single');
      setCarouselSize('portrait');

      toast.success('Workspace cleared!');
      setDraftsModalOpen(false);
    } catch (err) {
      console.error('Failed to clear workspace:', err);
      toast.error('Failed to start fresh.');
    }
  };

  return (
    <WorkspaceContext.Provider
      value={{
        view,
        setView,
        brandName,
        setBrandName,
        niche,
        setNiche,
        accentColor,
        setAccentColor,
        suggestedPalette,
        setSuggestedPalette,
        fontStyle,
        setFontStyle,
        fontDropdownOpen,
        setFontDropdownOpen,
        customFonts,
        setCustomFonts,
        images,
        setImages,
        logoUrl,
        setLogoUrl,
        logoMode,
        setLogoMode,
        logoWidth,
        setLogoWidth,
        logoOpacity,
        setLogoOpacity,
        slides,
        setSlides,
        currentSlide,
        setCurrentSlide,
        aiPrompt,
        setAiPrompt,
        topic,
        setTopic,
        selectedHookText,
        setSelectedHookText,
        suggestedHooks,
        setSuggestedHooks,
        isGeneratingHooks,
        setIsGeneratingHooks,
        chatRevision,
        setChatRevision,
        outsideContent,
        setOutsideContent,
        showOutsideImport,
        setShowOutsideImport,
        generatedCaption,
        setGeneratedCaption,
        activeTab,
        setActiveTab,
        viewMode,
        setViewMode,
        aiTool,
        setAiTool,
        carouselSize,
        setCarouselSize,
        draftsModalOpen,
        setDraftsModalOpen,
        savedDraftsList,
        setSavedDraftsList,
        bottomPadding,
        setBottomPadding,
        showWordmark,
        setShowWordmark,
        showCoverSlide,
        setShowCoverSlide,
        showRevealSlide,
        setShowRevealSlide,
        coverHeading,
        setCoverHeading,
        gradientHeight,
        setGradientHeight,
        fontSize,
        setFontSize,
        isDownloading,
        setIsDownloading,
        downloadProgress,
        setDownloadProgress,
        loadSavedDraftsList,
        loadStarterTemplate,
        getHeadingFont,
        getBodyFont,
        handleSaveDraftSnapshot,
        handleLoadDraftSnapshot,
        handleDeleteDraftSnapshot,
        handleStartFreshWorkspace
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
