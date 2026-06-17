import React from 'react';
import { Key, Plus, Layout, ArrowRight, Trash2, ChevronDown, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAi } from '../context/AiContext';
import { STARTER_TEMPLATES } from '../utils/constants';
import { SlideFrame } from '../features/canvas/components/SlideFrame';

function DraftThumbnail({ draft }: { draft: any }) {
  const isPortrait = draft.state.carouselSize === 'portrait';
  const firstSlide = draft.state.slides?.[0];
  
  if (!firstSlide) {
    return (
      <div className="w-full h-full bg-zinc-900 flex items-center justify-center text-[10px] text-white/30 uppercase font-bold text-center p-2">
        Empty
      </div>
    );
  }

  const width = 420;
  const height = isPortrait ? 525 : 420;

  return (
    <div className="relative w-full aspect-[4/5] bg-[#0c0c0e] rounded-xl border border-white/5 overflow-hidden flex items-center justify-center group-hover:border-white/20 transition-all duration-300 shadow-inner">
      <div 
        className="absolute"
        style={{
          width: `${width}px`,
          height: `${height}px`,
          transform: `scale(0.32)`,
          transformOrigin: 'center center',
          pointerEvents: 'none'
        }}
      >
        <SlideFrame 
          slide={firstSlide} 
          index={0} 
          interactive={false} 
        />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const {
    savedDraftsList,
    accentColor,
    startBlankProject,
    startTemplateProject,
    handleDeleteDraftSnapshot
  } = useWorkspace();

  const {
    geminiApiKey,
    setGeminiApiKey,
    activeModel,
    setActiveModel,
    models,
    handleClearToken
  } = useAi();

  const [dashboardModelOpen, setDashboardModelOpen] = React.useState(false);

  const editDraft = (id: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('page', 'editor');
    url.searchParams.set('id', id);
    window.history.pushState(null, '', url.toString());
    // Trigger popstate to let the context load the project
    window.dispatchEvent(new Event('popstate'));
  };

  return (
    <div className="h-full w-full overflow-y-auto custom-scrollbar animate-fadeIn" style={{
      backgroundColor: '#0A0A0A',
      backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(20, 15, 30, 0.7) 0%, #0A0A0A 80%)'
    }}>
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-12 pb-24">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-6">
          <div className="flex items-center gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#C8A97E"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-7 h-7 flex-shrink-0"
            >
              <rect x="2" y="7" width="10" height="12" rx="1.5" strokeOpacity="0.35" />
              <rect x="6" y="5" width="10" height="12" rx="1.5" strokeOpacity="0.65" />
              <rect x="10" y="3" width="10" height="12" rx="1.5" />
              <path
                d="M15 6.5Q15 9 17.5 9Q15 9 15 11.5Q15 9 12.5 9Q15 9 15 6.5z"
                fill="#C8A97E"
                stroke="none"
              />
            </svg>
            <div>
              <h1 className="text-sm font-bold text-white tracking-wider uppercase" style={{ fontFamily: 'NeueKabelBold, sans-serif' }}>
                AI Carousel Design
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
                        className="fixed inset-0 z-45 cursor-default" 
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
            Design premium, continuous-swipe decks for Instagram. Saved directly to your browser via IndexedDB.
          </p>
        </div>

        {/* Templates Section */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">Start Fresh</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-[500px]">
            {/* Blank Portrait */}
            <div
              onClick={() => startBlankProject('portrait')}
              className="group relative cursor-pointer overflow-hidden rounded-2xl border border-white/5 bg-white/[0.01] p-5 hover:bg-white/[0.03] hover:border-white/10 transition-all duration-300 flex flex-col justify-between h-[180px] shadow-lg"
            >
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/70 group-hover:text-white group-hover:bg-white/10 transition-all duration-300">
                  <Layout size={16} />
                </div>
                <h4 className="text-xs font-bold text-white group-hover:text-white transition-colors">Blank Portrait</h4>
                <p className="text-[10px] text-white/40 leading-normal">Instagram Feed (4:5)</p>
              </div>
              <div className="flex justify-between items-center text-[9px] text-white/30 font-bold uppercase tracking-wider">
                <span>1080 × 1350 px</span>
                <Plus size={12} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-300" />
              </div>
            </div>

            {/* Blank Square */}
            <div
              onClick={() => startBlankProject('square')}
              className="group relative cursor-pointer overflow-hidden rounded-2xl border border-white/5 bg-white/[0.01] p-5 hover:bg-white/[0.03] hover:border-white/10 transition-all duration-300 flex flex-col justify-between h-[180px] shadow-lg"
            >
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/70 group-hover:text-white group-hover:bg-white/10 transition-all duration-300">
                  <Layout size={16} className="rotate-90" />
                </div>
                <h4 className="text-xs font-bold text-white group-hover:text-white transition-colors">Blank Square</h4>
                <p className="text-[10px] text-white/40 leading-normal">Standard Feed (1:1)</p>
              </div>
              <div className="flex justify-between items-center text-[9px] text-white/30 font-bold uppercase tracking-wider">
                <span>1080 × 1080 px</span>
                <Plus size={12} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-300" />
              </div>
            </div>
          </div>
        </div>

        {/* Saved Carousels Section */}
        <div className="space-y-4 pt-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">Saved Carousels</h3>
          
          {savedDraftsList.length === 0 ? (
            <div className="border border-white/5 bg-white/[0.01] rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/20 border border-white/10">
                <Layout size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white/80">No saved projects yet</h4>
                <p className="text-[11px] text-white/40 mt-1 max-w-xs mx-auto leading-relaxed">
                  Start a fresh canvas, click "Save Draft" in the editor toolbar, and your project will appear here.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {savedDraftsList.map((draft) => (
                <div
                  key={draft.id}
                  className="group relative flex flex-col bg-white/[0.01] border border-white/5 rounded-2xl p-3 hover:bg-white/[0.03] hover:border-white/10 transition-all duration-300 shadow-xl overflow-hidden"
                >
                  {/* Thumbnail */}
                  <DraftThumbnail draft={draft} />

                  {/* Details */}
                  <div className="mt-3 space-y-1">
                    <h4 className="text-xs font-bold text-white/90 truncate group-hover:text-white transition-colors">
                      {draft.name}
                    </h4>
                    <div className="flex justify-between items-center text-[10px] text-white/40">
                      <span>{draft.slideCount} slides</span>
                      <span>{new Date(draft.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>

                  {/* Hover Actions overlay */}
                  <div className="absolute inset-0 bg-black/85 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-4 gap-2.5 z-20">
                    <span className="text-xs font-bold text-white/90 text-center line-clamp-2 px-2">
                      {draft.name}
                    </span>
                    <span className="text-[10px] text-white/45 uppercase tracking-wider mb-2">
                      {draft.state.carouselSize} ({draft.slideCount} slides)
                    </span>
                    <button
                      onClick={() => editDraft(draft.id)}
                      className="w-full py-2 rounded-lg text-xs font-bold text-zinc-950 flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition-transform cursor-pointer"
                      style={{ backgroundColor: accentColor }}
                    >
                      <span>Edit Deck</span>
                      <ArrowRight size={12} />
                    </button>
                    <button
                      onClick={() => handleDeleteDraftSnapshot(draft.id, draft.name)}
                      className="w-full py-2 rounded-lg text-xs font-bold bg-red-950/40 border border-red-500/20 hover:bg-red-950/60 text-red-400 flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                    >
                      <Trash2 size={12} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
