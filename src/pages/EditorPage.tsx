import React from 'react';
import { X, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useWorkspace } from '../context/WorkspaceContext';
import { useAi } from '../context/AiContext';
import { LeftSidebar } from '../features/editor/components/LeftSidebar';
import { RightSidebar } from '../features/editor/components/RightSidebar';
import { SlideCanvas } from '../features/canvas/components/SlideCanvas';
import { SlideFrame } from '../features/canvas/components/SlideFrame';

export default function EditorPage() {
  const {
    slides,
    accentColor,
    carouselSize,
    topic,
    brandName,
    activeTab,
    setActiveTab,
    generatedCaption,
    setGeneratedCaption,
    draftsModalOpen,
    setDraftsModalOpen,
    savedDraftsList,
    handleLoadDraftSnapshot,
    handleDeleteDraftSnapshot,
    handleStartFreshWorkspace,
    confirmModalOpen,
    setConfirmModalOpen,
    confirmModalConfig,
    showConfirm,
    saveModalOpen,
    setSaveModalOpen,
    saveModalConfig,
    aiTool
  } = useWorkspace();

  const {
    geminiApiKey,
    activeModel,
    isGeneratingAi,
    setIsGeneratingAi
  } = useAi();

  const [leftSidebarOpen, setLeftSidebarOpen] = React.useState(() => 
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );
  const [rightSidebarOpen, setRightSidebarOpen] = React.useState(() => 
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );

  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setLeftSidebarOpen(false);
        setRightSidebarOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Intercept keyboard reload events (F5, Ctrl+R, Cmd+R) to show custom confirm modal
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isF5 = e.key === 'F5' || e.keyCode === 116;
      const isCtrlR = (e.ctrlKey || e.metaKey) && (e.key === 'r' || e.key === 'R' || e.keyCode === 82);
      
      if (isF5 || isCtrlR) {
        if (slides.length > 0) {
          e.preventDefault();
          showConfirm(
            'Reload Page',
            'Are you sure you want to reload the page? Any unsaved edits will be lost.',
            () => {
              // Bypass standard unload prompt and reload page
              window.onbeforeunload = null;
              window.location.reload();
            }
          );
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [slides.length, showConfirm]);

  // Fallback native unload warning for other reload triggers (browser address bar button)
  React.useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (slides.length === 0) return;
      e.preventDefault();
      e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      return e.returnValue;
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [slides.length]);

  const sanitizeApiKey = (key: string): string => {
    if (!key) return '';
    return key.replace(/[\u200b-\u200d\uFEFF\u200e\u200f\u202a-\u202e]/g, '').trim();
  };

  const handleGenerateCaption = async () => {
    if (slides.length === 0) {
      toast.error('Please build your slide deck first.');
      return;
    }
    if (!geminiApiKey.trim()) {
      toast.error('Gemini API Key is required. Please set it in the Dashboard.');
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
1. Write a highly engaging, storytelling caption based on the slides (2-4 short paragraphs, markdown-formatted, with hooks and value delivery). Ensure you explicitly reference that the images and prompt are designed for/created with "${aiTool}".
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
    <div
      className="h-full flex main-wrapper w-full"
      style={{
        backgroundColor: '#0A0A0A'
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

      {/* Custom Save Modal */}
      {saveModalOpen && saveModalConfig && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-6 z-[99999] animate-fadeIn">
          <div className="w-full max-w-md bg-[#121214] border border-white/10 rounded-2xl flex flex-col overflow-hidden shadow-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">Save Project Draft</h3>
            <p className="text-xs text-white/50">Enter a name for this draft version of your project.</p>
            
            <input
              type="text"
              id="saveDraftInput"
              placeholder="Project Name..."
              defaultValue={saveModalConfig.initialName}
              className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-xl text-xs text-white placeholder-white/30 outline-none focus:border-indigo-500/50 transition-colors"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = (e.target as HTMLInputElement).value;
                  saveModalConfig.onSave(val);
                  setSaveModalOpen(false);
                }
              }}
            />
            
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setSaveModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const val = (document.getElementById('saveDraftInput') as HTMLInputElement).value;
                  saveModalConfig.onSave(val);
                  setSaveModalOpen(false);
                }}
                className="px-4 py-2 rounded-lg text-xs font-bold text-zinc-950 hover:opacity-90 transition-all cursor-pointer"
                style={{ backgroundColor: accentColor }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirm Modal */}
      {confirmModalOpen && confirmModalConfig && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-6 z-[99999] animate-fadeIn">
          <div className="w-full max-w-sm bg-[#121214] border border-white/10 rounded-2xl flex flex-col overflow-hidden shadow-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">{confirmModalConfig.title}</h3>
            <p className="text-xs text-white/60 leading-relaxed">{confirmModalConfig.message}</p>
            
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmModalConfig.onConfirm();
                  setConfirmModalOpen(false);
                }}
                className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors cursor-pointer"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

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
                  Manage your saved drafts or clear the workspace.
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
    </div>
  );
}
