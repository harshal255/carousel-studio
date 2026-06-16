import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Slide, ImageFile, SavedDraft, StarterTemplate, HookSuggestion } from '../types';
import { draftDb } from '../db/draftDb';
import { STARTER_TEMPLATES } from '../utils/constants';

interface WorkspaceContextType {
  view: 'dashboard' | 'editor';
  setView: (v: 'dashboard' | 'editor') => void;
  projectId: string | null;
  setProjectId: (v: string | null) => void;
  projectName: string;
  setProjectName: (v: string) => void;
  confirmModalOpen: boolean;
  setConfirmModalOpen: (v: boolean) => void;
  confirmModalConfig: { title: string; message: string; onConfirm: () => void } | null;
  setConfirmModalConfig: (v: { title: string; message: string; onConfirm: () => void } | null) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void) => void;
  saveModalOpen: boolean;
  setSaveModalOpen: (v: boolean) => void;
  saveModalConfig: { initialName: string; onSave: (name: string) => void } | null;
  setSaveModalConfig: (v: { initialName: string; onSave: (name: string) => void } | null) => void;
  showSaveModal: (initialName: string, onSave: (name: string) => void) => void;
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
  startBlankProject: (size: 'portrait' | 'square') => void;
  startTemplateProject: (template: StarterTemplate) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [view, setView] = useState<'dashboard' | 'editor'>('dashboard');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState<string>('');

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveModalConfig, setSaveModalConfig] = useState<{
    initialName: string;
    onSave: (name: string) => void;
  } | null>(null);

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModalConfig({ title, message, onConfirm });
    setConfirmModalOpen(true);
  };

  const showSaveModal = (initialName: string, onSave: (name: string) => void) => {
    setSaveModalConfig({ initialName, onSave });
    setSaveModalOpen(true);
  };

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

  const startBlankProject = (size: 'portrait' | 'square') => {
    const newId = Date.now().toString();
    setProjectId(newId);
    setProjectName(`Untitled ${size === 'portrait' ? 'Portrait' : 'Square'}`);
    setBrandName('mybrand.co');
    setNiche('Creative Agency');
    setAccentColor('#C8A97E');
    setFontStyle('editorial');
    setImages([]);
    setCarouselSize(size);

    const initialSlides: Slide[] = [
      {
        id: 'cover',
        type: 'cover',
        headingText: 'How to Build Something Awesome'
      },
      {
        id: 'slide-1',
        type: 'keyword',
        keywords: ['STEP 1'],
        headingText: 'Start with a plan',
        subText: 'Write down the key concepts you want to communicate in your carousel...'
      },
      {
        id: 'cta',
        type: 'cta',
        headingText: 'Get the full guide sent directly to your DMs',
        ctaLayout: 'comment',
        triggerWord: 'START'
      }
    ];

    setSlides(initialSlides);
    setCurrentSlide(0);
    setGradientHeight(75);
    setFontSize(25);
    setBottomPadding(5);
    setShowWordmark(true);
    setShowCoverSlide(true);
    setShowRevealSlide(false);
    setCoverHeading('How to Build Something Awesome');
    setAiPrompt('');
    setTopic('');
    setSelectedHookText('');
    setSuggestedHooks([]);
    setGeneratedCaption('');
    setLogoUrl(null);
    setLogoMode('text');
    setLogoWidth(24);
    setLogoOpacity(100);

    const url = new URL(window.location.href);
    url.searchParams.set('page', 'editor');
    url.searchParams.set('id', newId);
    window.history.pushState(null, '', url.toString());

    setView('editor');
    toast.success('Started a new blank project!');
  };

  const startTemplateProject = (template: StarterTemplate) => {
    const newId = Date.now().toString();
    setProjectId(newId);
    setProjectName(template.name);
    
    setBrandName(template.brandName);
    setNiche(template.niche);
    setAccentColor(template.accentColor);
    setFontStyle(template.fontStyle);
    setImages([]);
    setSlides(JSON.parse(JSON.stringify(template.slides)));
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
    setLogoUrl(null);
    setLogoMode('text');
    setLogoWidth(24);
    setLogoOpacity(100);

    const url = new URL(window.location.href);
    url.searchParams.set('page', 'editor');
    url.searchParams.set('id', newId);
    window.history.pushState(null, '', url.toString());

    setView('editor');
    toast.success(`Loaded template "${template.name}"!`);
  };

  // Synchronize state with URL query parameters
  useEffect(() => {
    const syncWithUrl = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const pageParam = searchParams.get('page') || 'dashboard';
      const idParam = searchParams.get('id');

      if (pageParam === 'editor' && idParam) {
        if (idParam !== projectId) {
          try {
            const draft = await draftDb.getDraft(idParam);
            if (draft && draft.state) {
              const saved = draft.state;
              setProjectId(draft.id);
              setProjectName(draft.name);
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
              setTopic(saved.topic ?? '');
              setSelectedHookText(saved.selectedHookText ?? '');
              setSuggestedHooks(saved.suggestedHooks ?? []);
              setGeneratedCaption(saved.generatedCaption ?? '');
              setViewMode(saved.viewMode ?? 'single');
              setView('editor');
            } else {
              toast.error('Project not found in drafts.');
              const url = new URL(window.location.href);
              url.searchParams.delete('page');
              url.searchParams.delete('id');
              window.history.pushState(null, '', url.toString());
              setView('dashboard');
            }
          } catch (e) {
            console.error('Failed to load project from URL ID:', e);
          }
        } else {
          setView('editor');
        }
      } else if (pageParam === 'editor') {
        // Redirect to dashboard if no ID is specified
        const url = new URL(window.location.href);
        url.searchParams.delete('page');
        window.history.pushState(null, '', url.toString());
        setView('dashboard');
      } else {
        setView('dashboard');
      }
    };

    syncWithUrl();

    const handlePopState = () => {
      syncWithUrl();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [projectId]);

  useEffect(() => {
    loadSavedDraftsList();
  }, []);

  // Keep slide image URLs in sync with uploaded images array in sequence
  useEffect(() => {
    console.log('[WorkspaceContext] useEffect triggered with images:', images.map(img => img.name || img.id), 'slides.length:', slides.length);
    setSlides(prevSlides => {
      let changed = false;
      let updatedSlides = [...prevSlides];

      // If we have more images than slides, expand slides to match
      if (images.length > updatedSlides.length) {
        const needed = images.length - updatedSlides.length;
        const ctaIndex = updatedSlides.findIndex(s => s.type === 'cta');
        
        const newSlidesToInsert: Slide[] = Array.from({ length: needed }, (_, i) => ({
          id: `slide-added-${Date.now()}-${Math.random().toString(36).substring(2, 6)}-${i}`,
          type: 'keyword',
          headingText: 'Swipe to see more',
          keywords: [`STEP ${updatedSlides.length + i + 1}`]
        }));

        if (ctaIndex !== -1) {
          updatedSlides.splice(ctaIndex, 0, ...newSlidesToInsert);
        } else {
          updatedSlides.push(...newSlidesToInsert);
        }
        changed = true;
        console.log(`[WorkspaceContext] Expanded slides by ${needed} to match image count of ${images.length}`);
      }

      const newSlides = updatedSlides.map((slide, idx) => {
        const expectedUrl = images.length > 0 ? (images[idx % images.length]?.url || '') : '';
        if (slide.imageUrl !== expectedUrl) {
          changed = true;
          console.log(`[WorkspaceContext] Syncing slide ${idx} image from "${slide.imageUrl ? slide.imageUrl.substring(0, 30) + '...' : 'none'}" to "${expectedUrl ? expectedUrl.substring(0, 30) + '...' : 'none'}"`);
          return { ...slide, imageUrl: expectedUrl };
        }
        return slide;
      });

      if (changed) {
        console.log('[WorkspaceContext] slides state changed, updating slides');
        return newSlides;
      }
      return prevSlides;
    });
  }, [images, slides.length]);

  const handleSaveDraftSnapshot = async () => {
    if (slides.length === 0) {
      toast.error('Cannot save an empty workspace draft.');
      return;
    }

    const defaultName = projectName || (topic.trim()
      ? `Draft: ${topic.slice(0, 25)}${topic.length > 25 ? '...' : ''}`
      : `Draft: ${brandName} (${slides.length} slides)`);

    showSaveModal(defaultName, async (chosenName) => {
      const id = projectId || Date.now().toString();
      const timestamp = Date.now();
      const name = chosenName.trim() || defaultName;
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
        setProjectId(id);
        setProjectName(name);

        const url = new URL(window.location.href);
        url.searchParams.set('page', 'editor');
        url.searchParams.set('id', id);
        window.history.pushState(null, '', url.toString());

        toast.success(`Project "${name}" saved successfully!`);
        loadSavedDraftsList();
      } catch (err) {
        console.error('Failed to save draft snapshot:', err);
        toast.error('Failed to save draft.');
      }
    });
  };

  const handleLoadDraftSnapshot = async (draft: SavedDraft) => {
    const saved = draft.state;
    if (!saved) return;

    try {
      setProjectId(draft.id);
      setProjectName(draft.name);
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

      const url = new URL(window.location.href);
      url.searchParams.set('page', 'editor');
      url.searchParams.set('id', draft.id);
      window.history.pushState(null, '', url.toString());

      toast.success(`Draft "${draft.name}" loaded!`);
      setDraftsModalOpen(false);
      setView('editor');
    } catch (err) {
      console.error('Failed to load draft:', err);
      toast.error('Failed to load draft.');
    }
  };

  const handleDeleteDraftSnapshot = async (id: string, name: string) => {
    showConfirm(
      'Delete Project',
      `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      async () => {
        try {
          await draftDb.deleteDraft(id);
          toast.success(`Draft "${name}" deleted.`);
          
          if (id === projectId) {
            setProjectId(null);
            setProjectName('');
            setSlides([]);
            const url = new URL(window.location.href);
            url.searchParams.delete('page');
            url.searchParams.delete('id');
            window.history.pushState(null, '', url.toString());
            setView('dashboard');
          }
          
          loadSavedDraftsList();
        } catch (err) {
          console.error('Failed to delete draft:', err);
          toast.error('Failed to delete draft.');
        }
      }
    );
  };

  const handleStartFreshWorkspace = async () => {
    showConfirm(
      'Clear Workspace',
      'Are you sure you want to clear the workspace and start fresh? All unsaved work will be lost.',
      async () => {
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
          setProjectId(null);
          setProjectName('');

          toast.success('Workspace cleared!');
          
          const url = new URL(window.location.href);
          url.searchParams.delete('page');
          url.searchParams.delete('id');
          window.history.pushState(null, '', url.toString());
          
          setView('dashboard');
          setDraftsModalOpen(false);
        } catch (err) {
          console.error('Failed to clear workspace:', err);
          toast.error('Failed to start fresh.');
        }
      }
    );
  };

  return (
    <WorkspaceContext.Provider
      value={{
        view,
        setView,
        projectId,
        setProjectId,
        projectName,
        setProjectName,
        confirmModalOpen,
        setConfirmModalOpen,
        confirmModalConfig,
        setConfirmModalConfig,
        showConfirm,
        saveModalOpen,
        setSaveModalOpen,
        saveModalConfig,
        setSaveModalConfig,
        showSaveModal,
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
        handleStartFreshWorkspace,
        startBlankProject,
        startTemplateProject
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
