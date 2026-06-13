import React from 'react';
import { Key, Folder, Plus, Layout, Sparkles, ArrowRight, Trash2, X, ChevronDown } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { WorkspaceProvider, useWorkspace } from '../context/WorkspaceContext';
import { AiProvider, useAi } from '../context/AiContext';
import { LeftSidebar } from '../features/editor/components/LeftSidebar';
import { RightSidebar } from '../features/editor/components/RightSidebar';
import { SlideCanvas } from '../features/canvas/components/SlideCanvas';
import { SlideFrame } from '../features/canvas/components/SlideFrame';
import { STARTER_TEMPLATES } from '../utils/constants';
import { Slide } from '../types';

function AppContent() {
  const {
    view,
    setView,
    brandName,
    setBrandName,
    niche,
    setNiche,
    accentColor,
    setAccentColor,
    setFontStyle,
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
    setSuggestedHooks,
    generatedCaption,
    setGeneratedCaption,
    activeTab,
    setActiveTab,
    carouselSize,
    setCarouselSize,
    draftsModalOpen,
    setDraftsModalOpen,
    savedDraftsList,
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
    loadSavedDraftsList,
    loadStarterTemplate,
    handleLoadDraftSnapshot,
    handleDeleteDraftSnapshot,
    handleStartFreshWorkspace,
    aiTool
  } = useWorkspace();

  const {
    geminiApiKey,
    setGeminiApiKey,
    activeModel,
    setActiveModel,
    models,
    isGeneratingAi,
    setIsGeneratingAi,
    handleClearToken
  } = useAi();

  const [leftSidebarOpen, setLeftSidebarOpen] = React.useState(() => typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);
  const [rightSidebarOpen, setRightSidebarOpen] = React.useState(() => typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);
  const [dashboardModelOpen, setDashboardModelOpen] = React.useState(false);

  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setLeftSidebarOpen(false);
        setRightSidebarOpen(false);
      }
    };
    // Initialize on mount
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const sanitizeApiKey = (key: string): string => {
    if (!key) return '';
    return key.replace(/[\u200b-\u200d\uFEFF\u200e\u200f\u202a-\u202e]/g, '').trim();
  };

  const startBlankProject = (size: 'portrait' | 'square') => {
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

    setView('editor');
    toast.success('Started a new blank project!');
  };

  const handleGenerateCaption = async () => {
    if (slides.length === 0) {
      toast.error('Please build your slide deck first.');
      return;
    }
    if (!geminiApiKey.trim()) {
      toast.error('Gemini API Key is required.');
      return;
    }

    setIsGeneratingAi(true);
    const toastId = toast.loading('Generating caption and keywords...');

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${sanitizeApiKey(geminiApiKey)}`;

      const promptText = `
You are the official Instagram copywriter for prompts.page. 
Write a high-converting, storytelling Instagram caption based EXACTLY on the content of these slides.

Slide content:
${JSON.stringify(slides.map(s => ({ type: s.type, headingText: s.headingText, triggerWord: s.triggerWord })), null, 2)}

AI Generator Tool Used for Images: "${aiTool}"

Rules for the output:
1. Write a highly engaging, storytelling caption based on the slides (2-4 short paragraphs, markdown-formatted, with hooks and value delivery). Ensure you explicitly reference that the images and prompt are designed for/created with "${aiTool}" (and do not hardcode 'Midjourney' if "${aiTool}" is different).
2. End the caption with the comments action trigger (e.g. "Comment '${slides.find(s => s.type === 'cta')?.triggerWord || 'STUDIO'}' to get this prompt sent straight to your DMs!").
3. After the caption, add EXACTLY two empty line breaks.
4. Then write "Viral keywords:" followed by up to 30 comma-separated SEO/viral keywords derived directly from the storytelling carousel text. Do not use hashtags (do not use '#' symbol).

Return only the final text output.
`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }]
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errMsg = 'API error';
        try {
          const errData = await response.json();
          errMsg = errData.error?.message || response.statusText || errMsg;
        } catch (_) {
          errMsg = response.statusText || errMsg;
        }
        throw new Error(errMsg);
      }

      const data = await response.json();
      const resParts = data.candidates?.[0]?.content?.parts || [];
      const nonThoughtPart = resParts.find((p: any) => !p.thought);
      const textResponse = nonThoughtPart ? nonThoughtPart.text : (resParts[0]?.text || '');

      if (!textResponse) {
        throw new Error('Empty response from API (blocked or empty content)');
      }

      setGeneratedCaption(textResponse.trim());
      toast.success('Successfully generated Instagram Caption & Keywords!', { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error(`Failed to generate caption: ${err.message || err}`, { id: toastId });
    } finally {
      setIsGeneratingAi(false);
    }
  };

  return (
    <div className="h-screen w-full overflow-hidden" style={{
      backgroundColor: '#0A0A0A',
      fontFamily: 'NeueKabelLight, sans-serif'
    }}>
      <Toaster position="top-center" reverseOrder={false} toastOptions={{ style: { background: '#111', color: '#fff', border: '1px solid rgba(255,255,255,0.07)' } }} />

      <style>{`
        textarea::placeholder {
          color: rgba(255, 255, 255, 0.3) !important;
          -webkit-text-fill-color: rgba(255, 255, 255, 0.3) !important;
        }
        textarea.transparent-text-input {
          color: transparent !important;
          -webkit-text-fill-color: transparent !important;
          caret-color: white !important;
        }
        textarea.transparent-text-input:focus {
          color: white !important;
          -webkit-text-fill-color: white !important;
        }
        textarea.transparent-text-input:focus + div {
          display: none !important;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
        }
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @media (max-width: 1023px) {
          .main-wrapper {
            position: relative;
            overflow: hidden;
            height: 100vh;
          }
          .preview-pane {
            padding: 76px 16px 16px 16px !important;
            width: 100% !important;
            height: 100% !important;
            flex: 1;
            z-index: 10;
          }
        }
        @media (max-width: 640px) {
          .preview-scale {
            transform: scale(0.75);
            transform-origin: center center;
          }
        }
        @media (max-width: 480px) {
          .preview-scale {
            transform: scale(0.6);
            transform-origin: center center;
          }
        }
      `}</style>

      {/* DASHBOARD VIEW */}
      {view === 'dashboard' && (
        <div className="h-full w-full overflow-y-auto custom-scrollbar animate-fadeIn" style={{
          backgroundColor: '#0A0A0A',
          backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(20, 15, 30, 0.7) 0%, #0A0A0A 80%)'
        }}>
          <div className="max-w-7xl mx-auto px-6 py-8 space-y-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm bg-gradient-to-tr from-indigo-500 to-purple-500 text-white shadow-lg">
                  C
                </div>
                <div>
                  <h1 className="text-sm font-bold text-white tracking-wider uppercase" style={{ fontFamily: 'NeueKabelBold, sans-serif' }}>
                    Carousel Studio
                  </h1>
                  <p className="text-[10px] text-white/45 tracking-widest uppercase">prompts.page · PRO</p>
                </div>
              </div>

              {/* API Key configuration in header */}
              <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3 bg-white/5 border border-white/10 px-3 sm:px-4 py-2 rounded-xl backdrop-blur-md w-full sm:w-auto relative z-30 flex-nowrap">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Key size={14} className="text-white/40 flex-shrink-0" />
                  <input
                    type="password"
                    placeholder="Gemini API Key..."
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    className="bg-transparent text-xs text-white placeholder-white/30 border-none outline-none w-full min-w-[60px] sm:w-36"
                  />
                </div>
                {geminiApiKey && (
                  <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    <span className="text-white/20">|</span>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setDashboardModelOpen(!dashboardModelOpen)}
                        className="bg-transparent text-xs text-white/80 hover:text-white border-none outline-none cursor-pointer flex items-center gap-1 focus:outline-none transition-colors"
                        style={{
                          fontFamily: 'NeueKabelLight, sans-serif'
                        }}
                      >
                        <span className="max-w-[85px] sm:max-w-[120px] truncate">
                          {models.find(m => m.name === activeModel)?.label || activeModel}
                        </span>
                        <ChevronDown size={12} className="text-white/40 flex-shrink-0" />
                      </button>

                      {dashboardModelOpen && (
                        <>
                          <div 
                            className="fixed inset-0 z-40 cursor-default" 
                            onClick={() => setDashboardModelOpen(false)} 
                          />
                          <div
                            className="absolute right-0 mt-2 z-50 w-64 rounded-xl border border-white/10 shadow-2xl overflow-y-auto max-h-64 custom-scrollbar"
                            style={{
                              backgroundColor: '#121212',
                              fontFamily: 'NeueKabelLight, sans-serif'
                            }}
                          >
                            {models.length === 0 ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setDashboardModelOpen(false);
                                }}
                                className="w-full text-left px-4 py-2.5 text-xs text-white/60 hover:text-white hover:bg-white/5 flex items-center justify-between border-b border-white/5 last:border-b-0 bg-white/10 font-bold"
                              >
                                <span className="truncate">{activeModel}</span>
                              </button>
                            ) : (
                              models.map(m => (
                                <button
                                  key={m.name}
                                  type="button"
                                  onClick={() => {
                                    setActiveModel(m.name);
                                    setDashboardModelOpen(false);
                                  }}
                                  className={`w-full text-left px-4 py-2.5 text-xs transition-colors duration-150 flex items-center justify-between border-b border-white/5 last:border-b-0 ${
                                    activeModel === m.name
                                      ? 'bg-white/10 text-white font-bold'
                                      : 'text-white/60 hover:text-white hover:bg-white/5'
                                  }`}
                                >
                                  <span className="truncate mr-2">{m.label || m.name}</span>
                                  {activeModel === m.name && (
                                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: accentColor }} />
                                  )}
                                </button>
                              ))
                            )}
                          </div>
                        </>
                      )}
                    </div>
                    <button
                      onClick={handleClearToken}
                      className="text-[10px] uppercase font-bold text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Hero Section */}
            <div className="text-center py-6 space-y-3">
              <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-white/95 to-white/60 tracking-tight" style={{ fontFamily: 'NeueKabelBold, sans-serif' }}>
                Create Carousels That Convert
              </h2>
              <p className="text-sm text-white/50 max-w-xl mx-auto leading-relaxed">
                Design premium, continuous-swipe decks for Instagram. Autosaved to your browser via IndexedDB.
              </p>
            </div>

            {/* Active Session / Resume Card */}
            {slides.length > 0 && (
              <div className="relative group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.04] shadow-2xl">
                <div className="absolute -inset-x-20 -inset-y-20 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-500" />
                
                <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10 w-full md:w-auto text-center sm:text-left">
                  {/* Mini Slide Preview (Thumbnail) */}
                  <div 
                    className="rounded-xl overflow-hidden shadow-2xl border border-white/10 flex-shrink-0 relative bg-black"
                    style={{
                      width: `${420 * 0.22}px`,
                      height: `${(carouselSize === 'portrait' ? 525 : 420) * 0.22}px`,
                    }}
                  >
                    <div 
                      style={{
                        transform: 'scale(0.22)',
                        transformOrigin: 'top left',
                        width: '420px',
                        height: carouselSize === 'portrait' ? '525px' : '420px',
                        pointerEvents: 'none'
                      }}
                    >
                      <SlideFrame 
                        slide={slides[0]} 
                        index={0} 
                        interactive={false} 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                      Active Project In Progress
                    </div>
                    <h3 className="text-lg font-bold text-white">
                      {brandName || 'Untitled Project'}
                    </h3>
                    <p className="text-xs text-white/40">
                      {slides.length} slides · Niche: {niche || 'Not set'} · Design: {carouselSize === 'portrait' ? 'Portrait (4:5)' : 'Square (1:1)'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setView('editor');
                    toast.success('Resumed editing active project!');
                  }}
                  className="relative z-10 w-full md:w-auto px-6 py-3 rounded-xl font-bold text-xs text-zinc-950 flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.03] active:scale-95 shadow-xl cursor-pointer"
                  style={{ backgroundColor: accentColor }}
                >
                  <span>Resume Design</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            )}

            {/* Quick Start Options */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">Start Fresh</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[856px]">
                <div
                  onClick={() => startBlankProject('portrait')}
                  className="group relative cursor-pointer overflow-hidden rounded-2xl border border-white/5 bg-white/[0.01] p-6 hover:bg-white/[0.03] hover:border-white/10 transition-all duration-300 flex flex-col justify-between h-[200px]"
                >
                  <div className="space-y-2">
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/70 group-hover:text-white group-hover:bg-white/10 transition-all duration-300">
                      <Layout size={16} />
                    </div>
                    <h4 className="text-sm font-bold text-white group-hover:text-white transition-colors">Blank Portrait</h4>
                    <p className="text-xs text-white/40">Ideal for Instagram scroll feeds.</p>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-white/30 font-bold uppercase tracking-wider mt-4">
                    <span>1080 × 1350 px (4:5)</span>
                    <Plus size={14} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                </div>

                <div
                  onClick={() => startBlankProject('square')}
                  className="group relative cursor-pointer overflow-hidden rounded-2xl border border-white/5 bg-white/[0.01] p-6 hover:bg-white/[0.03] hover:border-white/10 transition-all duration-300 flex flex-col justify-between h-[200px]"
                >
                  <div className="space-y-2">
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/70 group-hover:text-white group-hover:bg-white/10 transition-all duration-300">
                      <Layout size={16} className="rotate-90" />
                    </div>
                    <h4 className="text-sm font-bold text-white group-hover:text-white transition-colors">Blank Square</h4>
                    <p className="text-xs text-white/40">Perfect for standard feeds and cross-platform sharing.</p>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-white/30 font-bold uppercase tracking-wider mt-4">
                    <span>1080 × 1080 px (1:1)</span>
                    <Plus size={14} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                </div>
              </div>
            </div>


          </div>
        </div>
      )}

      {/* EDITOR VIEW */}
      <div
        className="h-full flex main-wrapper"
        style={{
          backgroundColor: '#0A0A0A',
          display: view === 'editor' ? 'flex' : 'none'
        }}
      >
        {/* Backdrop for left sidebar on mobile */}
        {leftSidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] cursor-pointer"
            onClick={() => setLeftSidebarOpen(false)}
          />
        )}

        {/* Backdrop for right sidebar on mobile */}
        {rightSidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] cursor-pointer"
            onClick={() => setRightSidebarOpen(false)}
          />
        )}

        {/* Left Sidebar wrapper with collapse animation */}
        <div
          className={`h-full transition-all duration-300 overflow-hidden flex-shrink-0 fixed lg:relative left-0 top-0 z-[100] lg:z-auto bg-[#0A0A0A] lg:bg-transparent ${leftSidebarOpen
            ? 'w-[320px] lg:w-[360px] translate-x-0'
            : 'w-[320px] lg:w-0 -translate-x-full lg:translate-x-0'
            }`}
          style={{
            borderRight: leftSidebarOpen ? '1px solid rgba(255,255,255,0.07)' : 'none'
          }}
        >
          {leftSidebarOpen && (
            <div className="lg:hidden flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#111111] h-[64px] flex-shrink-0">
              <span className="text-xs uppercase tracking-widest font-bold text-white/50">Brand & Assets</span>
              <button
                onClick={() => setLeftSidebarOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 text-white/70 hover:text-white cursor-pointer hover:bg-white/10 transition-all duration-200"
                title="Close Left Sidebar"
              >
                <X size={16} />
              </button>
            </div>
          )}
          <div className="h-[calc(100%-64px)] lg:h-full w-full">
            <LeftSidebar />
          </div>
        </div>

        {/* CENTER PANEL - Slide view / Caption tab */}
        <div className="flex-1 flex flex-col items-center justify-start pt-20 pb-6 px-6 md:pt-24 md:pb-8 md:px-8 preview-pane gap-3 overflow-hidden relative">
          {/* Left Sidebar desktop toggle button */}
          <button
            onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
            className="absolute left-6 top-6 w-9 h-9 rounded-xl flex items-center justify-center bg-[#111111] hover:bg-[#222222] active:bg-[#333333] focus:bg-[#222222] border border-white/10 text-white/70 hover:text-white transition-all duration-200 z-50 cursor-pointer shadow-lg"
            title={leftSidebarOpen ? "Collapse Left Sidebar" : "Expand Left Sidebar"}
          >
            {leftSidebarOpen ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M9 3v18" />
                <path d="M16 15l-3-3 3-3" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M9 3v18" />
                <path d="M12 9l3 3-3 3" />
              </svg>
            )}
          </button>

          {/* Right Sidebar desktop toggle button */}
          <button
            onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
            className="absolute right-6 top-6 w-9 h-9 rounded-xl flex items-center justify-center bg-[#111111] hover:bg-[#222222] active:bg-[#333333] focus:bg-[#222222] border border-white/10 text-white/70 hover:text-white transition-all duration-200 z-50 cursor-pointer shadow-lg"
            title={rightSidebarOpen ? "Collapse Right Sidebar" : "Expand Right Sidebar"}
          >
            {rightSidebarOpen ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M15 3v18" />
                <path d="M8 9l3 3-3 3" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M15 3v18" />
                <path d="M12 15l-3-3 3-3" />
              </svg>
            )}
          </button>

          <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/10 w-full max-w-[420px] mb-2 flex-shrink-0 z-10">
            <button
              onClick={() => setActiveTab('preview')}
              className="flex-1 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer"
              style={{
                backgroundColor: activeTab === 'preview' ? accentColor : 'transparent',
                color: activeTab === 'preview' ? '#0A0A0A' : 'rgba(255,255,255,0.6)'
              }}
            >
              Slide Preview
            </button>
            <button
              onClick={() => setActiveTab('caption')}
              className="flex-1 py-2 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer"
              style={{
                backgroundColor: activeTab === 'caption' ? accentColor : 'transparent',
                color: activeTab === 'caption' ? '#0A0A0A' : 'rgba(255,255,255,0.6)'
              }}
            >
              Instagram Caption & SEO
            </button>
          </div>

          {activeTab === 'preview' ? (
            <SlideCanvas />
          ) : (
            <div
              className="w-full max-w-[420px] rounded-2xl border flex flex-col justify-between p-6 overflow-hidden relative flex-shrink-0"
              style={{
                backgroundColor: '#111111',
                borderColor: 'rgba(255,255,255,0.07)',
                height: carouselSize === 'portrait' ? '525px' : '420px'
              }}
            >
              <div className="space-y-4 flex-1 flex flex-col overflow-hidden">
                <div className="flex justify-between items-center">
                  <span style={{ fontSize: '10px', letterSpacing: '2.5px', textTransform: 'uppercase', color: accentColor }}>
                    Storytelling Caption & Keywords
                  </span>
                  {generatedCaption && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedCaption);
                        toast.success('Caption copied to clipboard!');
                      }}
                      className="px-3 py-1 rounded bg-white/10 hover:bg-white/15 border border-white/10 text-[10px] text-white cursor-pointer"
                    >
                      Copy
                    </button>
                  )}
                </div>

                {generatedCaption ? (
                  <div
                    className="text-xs text-white/80 overflow-y-auto pr-2 custom-scrollbar whitespace-pre-wrap leading-relaxed flex-1"
                    style={{ fontFamily: 'PTMonoRegular, monospace' }}
                  >
                    {generatedCaption}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 p-4">
                    <span className="text-white/40 text-xs">
                      Generate a storytelling caption and 30 viral keywords based on your finalized slides.
                    </span>
                    <button
                      onClick={handleGenerateCaption}
                      disabled={isGeneratingAi}
                      className="py-2 px-4 rounded bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-bold text-white transition-all duration-200 cursor-pointer"
                    >
                      {isGeneratingAi ? 'Writing...' : 'Generate Caption'}
                    </button>
                  </div>
                )}
              </div>
              {generatedCaption && (
                <button
                  onClick={handleGenerateCaption}
                  disabled={isGeneratingAi}
                  className="w-full py-2.5 mt-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white transition-all duration-200 cursor-pointer"
                >
                  {isGeneratingAi ? 'Regenerating...' : 'Regenerate Caption'}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar wrapper with collapse animation */}
        <div
          className={`h-full transition-all duration-300 overflow-hidden flex-shrink-0 fixed lg:relative right-0 top-0 z-[100] lg:z-auto bg-[#0A0A0A] lg:bg-transparent ${rightSidebarOpen
            ? 'w-[320px] lg:w-[360px] translate-x-0'
            : 'w-[320px] lg:w-0 translate-x-full lg:translate-x-0'
            }`}
          style={{
            borderLeft: rightSidebarOpen ? '1px solid rgba(255,255,255,0.07)' : 'none'
          }}
        >
          {rightSidebarOpen && (
            <div className="lg:hidden flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#111111] h-[64px] flex-shrink-0">
              <button
                onClick={() => setRightSidebarOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 text-white/70 hover:text-white cursor-pointer hover:bg-white/10 transition-all duration-200"
                title="Close Right Sidebar"
              >
                <X size={16} />
              </button>
              <span className="text-xs uppercase tracking-widest font-bold text-white/50">Slide Editor</span>
            </div>
          )}
          <div className="h-[calc(100%-64px)] lg:h-full w-full">
            <RightSidebar />
          </div>
        </div>
      </div>

      {/* Drafts History Modal */}
      {draftsModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-6 z-[9999]">
          <div
            className="w-full max-w-2xl bg-zinc-950 border border-white/10 rounded-2xl flex flex-col max-h-[80vh] overflow-hidden shadow-2xl animate-fadeIn"
            style={{ fontFamily: 'NeueKabelLight, sans-serif' }}
          >
            <div className="flex justify-between items-center p-6 border-b border-white/10">
              <div>
                <h3 className="text-base font-bold tracking-wide uppercase" style={{ color: accentColor }}>
                  Draft History
                </h3>
                <p className="text-xs text-white/50 mt-1">
                  Manage your saved drafts or clear the workspace. Autosave is active.
                </p>
              </div>
              <button
                onClick={() => setDraftsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white transition-all duration-200 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {savedDraftsList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/30">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                    </svg>
                  </div>
                  <div className="text-sm font-semibold text-white/80">No saved drafts yet</div>
                  <div className="text-xs text-white/40 max-w-sm">
                    Click "Save Draft" in the editor sidebar to capture named snapshot versions of your project.
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {savedDraftsList.map((draft) => (
                    <div
                      key={draft.id}
                      className="group relative flex gap-3 p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all duration-200"
                    >
                      <div className="w-16 h-20 rounded bg-zinc-900 border border-white/10 flex-shrink-0 overflow-hidden relative">
                        {draft.thumbnailUrl ? (
                          <img
                            src={draft.thumbnailUrl}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-[10px] text-white/20 uppercase font-bold text-center p-1 leading-normal">
                            {draft.state.brandName.substring(0, 8)}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 flex flex-col justify-between">
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-white/90 group-hover:text-white line-clamp-1 transition-colors duration-150">
                            {draft.name}
                          </h4>
                          <p className="text-[10px] text-white/50">
                            {draft.slideCount} slides · {new Date(draft.timestamp).toLocaleDateString()}
                          </p>
                          <p className="text-[9px] text-white/30">
                            {new Date(draft.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={async () => {
                              await handleLoadDraftSnapshot(draft);
                            }}
                            className="flex-1 py-1 rounded text-[10px] font-bold text-zinc-950 transition-all duration-150 cursor-pointer"
                            style={{ backgroundColor: accentColor }}
                          >
                            Load
                          </button>
                          <button
                            onClick={() => handleDeleteDraftSnapshot(draft.id, draft.name)}
                            className="px-2.5 py-1 rounded bg-red-950/40 border border-red-500/20 text-[10px] text-red-400 hover:bg-red-950/60 transition-all duration-150 cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-white/10 bg-black/30 flex flex-col sm:flex-row justify-between gap-3">
              <button
                onClick={handleStartFreshWorkspace}
                className="px-4 py-2 rounded-lg bg-red-950/20 border border-red-500/10 text-xs font-bold text-red-400 hover:bg-red-950/40 transition-all duration-200 cursor-pointer"
              >
                Clear Workspace & Start Fresh
              </button>
              <button
                onClick={() => setDraftsModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-white hover:bg-white/10 transition-all duration-200 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HIDDEN EXPORT CONTAINER (1080x1350 vertical high-resolution / 1080x1080 square) */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '0', height: '0', overflow: 'hidden' }}>
        {slides.map((slide, index) => (
          <SlideFrame
            key={slide.id}
            slide={slide}
            index={index}
            isExport
          />
        ))}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <WorkspaceProvider>
      <AiProvider>
        <AppContent />
      </AiProvider>
    </WorkspaceProvider>
  );
}
