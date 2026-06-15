import React, { useRef, useState } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, X, Sparkles, MoveHorizontal, MoveVertical, RotateCcw, RotateCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useWorkspace } from '../../../context/WorkspaceContext';
import { useAi } from '../../../context/AiContext';
import { Slide } from '../../../types';
import { isVideoUrl } from '../../../utils/helpers';

export const RightSidebar: React.FC = () => {
  const {
    slides,
    setSlides,
    currentSlide,
    setCurrentSlide,
    accentColor,
    images,
    coverHeading,
    setCoverHeading,
    aiPrompt,
    setAiPrompt,
    topic,
    selectedHookText,
    generatedCaption,
    setGeneratedCaption,
    viewMode,
    carouselSize,
    logoUrl,
    logoMode,
    logoWidth,
    logoOpacity,
    gradientHeight,
    fontSize,
    bottomPadding,
    showWordmark,
    showCoverSlide,
    showRevealSlide,
    aiTool,
    chatRevision,
    setChatRevision,
    outsideContent,
    setOutsideContent,
    showOutsideImport,
    setShowOutsideImport
  } = useWorkspace();

  const {
    geminiApiKey,
    activeModel,
    isGeneratingAi,
    setIsGeneratingAi
  } = useAi();

  const totalSlides = slides.length || 1;
  const currentSlideData = slides[currentSlide] || { id: 'fallback', type: 'keyword', keywords: [], imageUrl: undefined, headingText: '' };

  const sanitizeApiKey = (key: string): string => {
    if (!key) return '';
    return key.replace(/[\u200b-\u200d\uFEFF\u200e\u200f\u202a-\u202e]/g, '').trim();
  };

  const cleanAndParseJson = (text: string) => {
    let cleaned = text.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
    }
    try {
      return JSON.parse(cleaned);
    } catch (err) {
      const firstSquare = cleaned.indexOf('[');
      const firstCurly = cleaned.indexOf('{');
      let startIdx = -1;
      let endIdx = -1;
      if (firstSquare !== -1 && (firstCurly === -1 || firstSquare < firstCurly)) {
        startIdx = firstSquare;
        endIdx = cleaned.lastIndexOf(']');
      } else if (firstCurly !== -1) {
        startIdx = firstCurly;
        endIdx = cleaned.lastIndexOf('}');
      }
      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        const subStr = cleaned.slice(startIdx, endIdx + 1);
        return JSON.parse(subStr);
      }
      throw err;
    }
  };

  const addSlide = () => {
    const newId = `slide-${Math.random().toString(36).substring(2, 6)}`;
    setSlides(prev => [
      ...prev,
      {
        id: newId,
        type: 'keyword',
        headingText: 'New Slide Heading',
        keywords: ['TERM']
      }
    ]);
    setCurrentSlide(slides.length);
    toast.success('Added slide');
  };

  const deleteSlide = (index: number) => {
    if (slides.length <= 1) {
      toast.error('You must keep at least one slide.');
      return;
    }
    const newSlides = [...slides];
    newSlides.splice(index, 1);
    setSlides(newSlides);
    setCurrentSlide(Math.max(0, index - 1));
    toast.success('Deleted slide');
  };

  const moveSlide = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= slides.length) return;
    const newSlides = [...slides];
    const temp = newSlides[index];
    newSlides[index] = newSlides[targetIndex];
    newSlides[targetIndex] = temp;
    setSlides(newSlides);
    setCurrentSlide(targetIndex);
  };

  const handleImportOutsideContent = () => {
    if (!outsideContent.trim()) {
      toast.error('Please paste JSON slide data first.');
      return;
    }

    try {
      const parsed = JSON.parse(outsideContent.trim());
      if (Array.isArray(parsed)) {
        const mapped = parsed.map((s: any, idx: number) => {
          let imageUrl = undefined;
          if (s.imageName) {
            const found = images.find(img => img.file?.name === s.imageName);
            if (found) imageUrl = found.url;
          }
          if (imageUrl === undefined) {
            imageUrl = images[idx % images.length]?.url || undefined;
          }

          return {
            id: `slide-import-${idx}-${Math.random().toString(36).substring(2, 6)}`,
            type: s.type || 'keyword',
            keywords: s.keywords || [],
            headingText: s.headingText || s.text || '',
            triggerWord: s.triggerWord || 'STUDIO',
            imageUrl
          };
        });
        setSlides(mapped);
        setCurrentSlide(0);
        toast.success('Successfully imported JSON copy deck!');
      } else {
        toast.error('Invalid JSON format. Expected an array of slide objects.');
      }
    } catch (e: any) {
      toast.error(`Failed to parse JSON: ${e.message || e}`);
    }
  };

  const handleAiRefine = async () => {
    if (slides.length === 0) {
      toast.error('No slides to refine. Please generate or import slides first.');
      return;
    }
    if (!chatRevision.trim()) {
      toast.error('Please type a change suggestion.');
      return;
    }
    if (!geminiApiKey.trim()) {
      toast.error('Gemini API Key is required.');
      return;
    }

    setIsGeneratingAi(true);
    const toastId = toast.loading('Applying revisions with Gemini...');

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${sanitizeApiKey(geminiApiKey)}`;

      const promptText = `
You are the official prompts.page Instagram Carousel strategist.
Update the current slide deck based on the user's revision request: "${chatRevision}".

Current slide deck:
${JSON.stringify(slides.map(s => ({ type: s.type, keywords: s.keywords, headingText: s.headingText, triggerWord: s.triggerWord })), null, 2)}

Make changes ONLY where requested, preserving the rest of the structure.
Return ONLY a raw JSON array matching this TypeScript structure:
[
  { "type": "cover" | "keyword" | "reveal" | "cta", "keywords": ["optional"], "headingText": "updated text", "triggerWord": "optional" }
]
Do not wrap the output in markdown code blocks. Return only the raw JSON.
`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: {
            responseMimeType: 'application/json'
          }
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

      const parsed = cleanAndParseJson(textResponse);
      if (Array.isArray(parsed)) {
        const updatedSlides = slides.map((s, idx) => {
          const u = parsed[idx] || {};
          return {
            ...s,
            type: u.type || s.type,
            keywords: u.keywords || s.keywords,
            headingText: u.headingText || s.headingText,
            triggerWord: u.triggerWord || s.triggerWord
          };
        });
        setSlides(updatedSlides);
        setChatRevision('');
        toast.success('Successfully updated slides!', { id: toastId });
      } else {
        throw new Error('Response is not a JSON array');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(`Failed to apply edits: ${err.message || err}`, { id: toastId });
    } finally {
      setIsGeneratingAi(false);
    }
  };

  return (
    <div className="w-full h-full flex-shrink-0 overflow-y-auto custom-scrollbar editor-sidebar" style={{
      backgroundColor: '#111111'
    }}>
      <div className="p-6 space-y-6">
        {/* Slide Customizer Editor */}
        {slides.length > 0 && (
          <section className="space-y-4">
            <label style={{
              fontSize: '10px',
              letterSpacing: '2.5px',
              textTransform: 'uppercase',
              color: accentColor,
              display: 'block'
            }}>
              Slide Editor (Slide {currentSlide + 1}/{totalSlides})
            </label>

            {/* Slide Type Selection */}
            <div className="space-y-2">
              <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.60)' }}>
                Slide Type
              </label>
              <div className="flex gap-1 bg-white/5 p-0.5 rounded-lg border border-white/10">
                {(['cover', 'keyword', 'reveal', 'cta'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => {
                      const newSlides = [...slides];
                      newSlides[currentSlide].type = type;
                      setSlides(newSlides);
                    }}
                    className="flex-1 py-1 text-[10px] capitalize rounded transition-all duration-150 cursor-pointer"
                    style={{
                      backgroundColor: currentSlideData.type === type ? accentColor : 'transparent',
                      color: currentSlideData.type === type ? '#0A0A0A' : 'rgba(255,255,255,0.6)'
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Slide Text Customization */}
            <div className="space-y-2">
              <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.60)' }}>
                {currentSlideData.type === 'cover' ? 'Cover Title' : currentSlideData.type === 'reveal' ? 'Reveal Prompt' : 'Slide Heading Text'}
              </label>
              {currentSlideData.type === 'reveal' ? (
                <textarea
                  value={currentSlideData.headingText || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const newSlides = [...slides];
                    newSlides[currentSlide].headingText = val;
                    setSlides(newSlides);
                  }}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border transition-all duration-200 resize-none focus:outline-none"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    borderColor: 'rgba(255,255,255,0.07)',
                    color: 'rgba(255,255,255,0.90)',
                    fontSize: '13px',
                    fontFamily: 'NeueKabelLight, sans-serif'
                  }}
                />
              ) : (
                <input
                  type="text"
                  value={currentSlideData.headingText || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const newSlides = [...slides];
                    newSlides[currentSlide].headingText = val;
                    if (currentSlideData.id === 'cover') {
                      setCoverHeading(val);
                    }
                    setSlides(newSlides);
                  }}
                  className="w-full px-3 py-2 rounded-lg border transition-all duration-200 focus:outline-none"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    borderColor: 'rgba(255,255,255,0.07)',
                    color: 'rgba(255,255,255,0.90)',
                    fontSize: '13px',
                    fontFamily: 'NeueKabelLight, sans-serif'
                  }}
                />
              )}
              <span className="text-[10px] text-white/40 block mt-1 leading-normal">
                Tip: Wrap key terms in *asterisks* to highlight them in the brand accent color (e.g. *High-Value*).
              </span>
            </div>

            {/* Keyword specific input for subText */}
            {currentSlideData.type === 'keyword' && (
              <div className="space-y-2">
                <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.60)' }}>
                  Slide Subtext
                </label>
                <textarea
                  value={currentSlideData.subText || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    const newSlides = [...slides];
                    newSlides[currentSlide].subText = val;
                    setSlides(newSlides);
                  }}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border transition-all duration-200 resize-none focus:outline-none"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.04)',
                    borderColor: 'rgba(255,255,255,0.07)',
                    color: 'rgba(255,255,255,0.90)',
                    fontSize: '13px',
                    fontFamily: 'NeueKabelLight, sans-serif'
                  }}
                />
              </div>
            )}

            {/* Specific field for CTA Slide styling */}
            {currentSlideData.type === 'cta' && (
              <div className="space-y-4">
                {/* Layout Selector */}
                <div className="space-y-2">
                  <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.60)' }}>
                    CTA Layout Style
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 bg-white/5 p-1 rounded-lg border border-white/10">
                    {([
                      { id: 'comment', label: 'Comment Pill' },
                      { id: 'likesave', label: 'Like & Save' },
                      { id: 'sharesave', label: 'Share & Collab' },
                      { id: 'all', label: 'All-in-One' }
                    ] as const).map(preset => (
                      <button
                        key={preset.id}
                        onClick={() => {
                          const newSlides = [...slides];
                          newSlides[currentSlide].ctaLayout = preset.id;
                          setSlides(newSlides);
                          toast.success(`CTA style updated: ${preset.label}`);
                        }}
                        className="py-1.5 px-2 rounded text-[10px] font-medium transition-all duration-150 text-center cursor-pointer"
                        style={{
                          backgroundColor: (currentSlideData.ctaLayout || 'comment') === preset.id ? accentColor : 'transparent',
                          color: (currentSlideData.ctaLayout || 'comment') === preset.id ? '#0A0A0A' : 'rgba(255,255,255,0.6)'
                        }}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Trigger Word input - only shown for comment trigger layout */}
                {(!currentSlideData.ctaLayout || currentSlideData.ctaLayout === 'comment') && (
                  <div className="space-y-2">
                    <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.60)' }}>
                      Comment Trigger Word
                    </label>
                    <input
                      type="text"
                      value={currentSlideData.triggerWord || 'STUDIO'}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        const newSlides = [...slides];
                        newSlides[currentSlide].triggerWord = val;
                        setSlides(newSlides);
                      }}
                      placeholder="e.g. STUDIO"
                      className="w-full px-3 py-2 rounded-lg border transition-all duration-200 focus:outline-none"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.04)',
                        borderColor: 'rgba(255,255,255,0.07)',
                        color: 'rgba(255,255,255,0.90)',
                        fontSize: '13px',
                        fontFamily: 'NeueKabelLight, sans-serif'
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Specific Image Placement Selector */}
            <div className="space-y-2">
              <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.60)' }}>
                Place Background Image
              </label>
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => {
                    const newSlides = [...slides];
                    newSlides[currentSlide].imageUrl = '';
                    setSlides(newSlides);
                    toast.success('Background image removed');
                  }}
                  className="aspect-[4/5] rounded border flex items-center justify-center text-center transition-all duration-200 cursor-pointer"
                  style={{
                    borderColor: currentSlideData.imageUrl === '' || currentSlideData.imageUrl === undefined ? accentColor : 'rgba(255,255,255,0.1)',
                    backgroundColor: currentSlideData.imageUrl === '' || currentSlideData.imageUrl === undefined ? 'rgba(200,169,126,0.1)' : 'rgba(255,255,255,0.02)',
                    fontSize: '9px',
                    color: currentSlideData.imageUrl === '' || currentSlideData.imageUrl === undefined ? accentColor : 'rgba(255,255,255,0.4)'
                  }}
                >
                  None
                </button>
                {images.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => {
                      const newSlides = [...slides];
                      newSlides[currentSlide].imageUrl = img.url;
                      setSlides(newSlides);
                      toast.success('Background image updated!');
                    }}
                    className="relative aspect-[4/5] rounded overflow-hidden border transition-all duration-200 hover:scale-105 cursor-pointer"
                    style={{
                      borderColor: currentSlideData.imageUrl === img.url ? accentColor : 'rgba(255,255,255,0.1)'
                    }}
                    title={img.name || img.file?.name || 'Uploaded image'}
                  >
                    {isVideoUrl(img.url) ? (
                      <video src={img.url} className="w-full h-full object-cover" muted playsInline autoPlay loop />
                    ) : (
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Image Adjustments */}
            {currentSlideData.imageUrl && (
              <div className="space-y-4 border-t pt-4 border-white/5">
                <label style={{
                  fontSize: '10px',
                  letterSpacing: '2.5px',
                  textTransform: 'uppercase',
                  color: accentColor,
                  display: 'block'
                }}>
                  Image Adjustments
                </label>

                <div className="text-[10px] text-white/40 bg-white/5 border border-white/10 rounded px-2.5 py-1.5 flex items-center gap-1.5 leading-normal">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white/60">
                    <path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20" />
                  </svg>
                  <span>Drag slide image to pan & position</span>
                </div>

                {/* Zoom */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-white/60">
                    <span>Zoom / Scale</span>
                    <span>{Math.round((currentSlideData.imageZoom ?? 1) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.01"
                    value={currentSlideData.imageZoom ?? 1}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      const newSlides = [...slides];
                      newSlides[currentSlide].imageZoom = val;
                      setSlides(newSlides);
                    }}
                    className="w-full"
                    style={{ accentColor }}
                  />
                </div>

                {/* Rotation */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-white/60">
                    <span>Rotation</span>
                    <span>{(currentSlideData.imageRotate ?? 0) + '°'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      step="1"
                      value={currentSlideData.imageRotate ?? 0}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        const newSlides = [...slides];
                        newSlides[currentSlide].imageRotate = val;
                        setSlides(newSlides);
                      }}
                      className="flex-1"
                      style={{ accentColor }}
                    />
                    <button
                      onClick={() => {
                        const newSlides = [...slides];
                        const currentRot = currentSlideData.imageRotate ?? 0;
                        let newRot = currentRot - 90;
                        if (newRot < -180) newRot += 360;
                        newSlides[currentSlide].imageRotate = newRot;
                        setSlides(newSlides);
                      }}
                      className="px-2 py-1 bg-white/5 border border-white/10 hover:bg-white/10 rounded text-[10px] text-white font-mono flex items-center justify-center cursor-pointer"
                      title="-90°"
                    >
                      <RotateCcw size={12} />
                    </button>
                    <button
                      onClick={() => {
                        const newSlides = [...slides];
                        const currentRot = currentSlideData.imageRotate ?? 0;
                        let newRot = currentRot + 90;
                        if (newRot > 180) newRot -= 360;
                        newSlides[currentSlide].imageRotate = newRot;
                        setSlides(newSlides);
                      }}
                      className="px-2 py-1 bg-white/5 border border-white/10 hover:bg-white/10 rounded text-[10px] text-white font-mono flex items-center justify-center cursor-pointer"
                      title="+90°"
                    >
                      <RotateCw size={12} />
                    </button>
                  </div>
                </div>

                {/* Pan X Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-white/60">
                    <span>Manual Pan X</span>
                    <span>{Math.round(currentSlideData.imagePanX ?? 0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    step="0.5"
                    value={currentSlideData.imagePanX ?? 0}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      const newSlides = [...slides];
                      newSlides[currentSlide].imagePanX = val;
                      setSlides(newSlides);
                    }}
                    className="w-full"
                    style={{ accentColor }}
                  />
                </div>

                {/* Pan Y Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-white/60">
                    <span>Manual Pan Y</span>
                    <span>{Math.round(currentSlideData.imagePanY ?? 0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    step="0.5"
                    value={currentSlideData.imagePanY ?? 0}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      const newSlides = [...slides];
                      newSlides[currentSlide].imagePanY = val;
                      setSlides(newSlides);
                    }}
                    className="w-full"
                    style={{ accentColor }}
                  />
                </div>

                {/* Flipping and Mirroring */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const newSlides = [...slides];
                      newSlides[currentSlide].imageFlipH = !currentSlideData.imageFlipH;
                      setSlides(newSlides);
                      toast.success(newSlides[currentSlide].imageFlipH ? 'Mirrored horizontally' : 'Horizontal flip cleared');
                    }}
                    className="flex-1 py-1.5 text-[10px] font-bold rounded border transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer"
                    style={{
                      backgroundColor: currentSlideData.imageFlipH ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.02)',
                      borderColor: currentSlideData.imageFlipH ? accentColor : 'rgba(255,255,255,0.07)',
                      color: currentSlideData.imageFlipH ? accentColor : 'rgba(255,255,255,0.6)'
                    }}
                  >
                    <MoveHorizontal size={12} /> Flip Horizontal
                  </button>
                  <button
                    onClick={() => {
                      const newSlides = [...slides];
                      newSlides[currentSlide].imageFlipV = !currentSlideData.imageFlipV;
                      setSlides(newSlides);
                      toast.success(newSlides[currentSlide].imageFlipV ? 'Mirrored vertically' : 'Vertical flip cleared');
                    }}
                    className="flex-1 py-1.5 text-[10px] font-bold rounded border transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer"
                    style={{
                      backgroundColor: currentSlideData.imageFlipV ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.02)',
                      borderColor: currentSlideData.imageFlipV ? accentColor : 'rgba(255,255,255,0.07)',
                      color: currentSlideData.imageFlipV ? accentColor : 'rgba(255,255,255,0.6)'
                    }}
                  >
                    <MoveVertical size={12} /> Flip Vertical
                  </button>
                </div>

                {/* Reset Button */}
                <button
                  onClick={() => {
                    const newSlides = [...slides];
                    newSlides[currentSlide].imageZoom = 1;
                    newSlides[currentSlide].imageRotate = 0;
                    newSlides[currentSlide].imagePanX = 0;
                    newSlides[currentSlide].imagePanY = 0;
                    newSlides[currentSlide].imageFlipH = false;
                    newSlides[currentSlide].imageFlipV = false;
                    setSlides(newSlides);
                    toast.success('Adjustments reset');
                  }}
                  className="w-full py-1.5 text-[10px] font-bold tracking-wider rounded bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:text-white transition-all duration-150 cursor-pointer"
                >
                  RESET ADJUSTMENTS
                </button>
              </div>
            )}

            {/* Move / Reordering Actions */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => moveSlide(currentSlide, 'up')}
                disabled={currentSlide === 0}
                className="flex-1 py-1.5 rounded bg-white/5 border border-white/10 text-[11px] text-white/70 hover:bg-white/10 disabled:opacity-30 flex items-center justify-center gap-1 cursor-pointer"
              >
                <ChevronUp size={12} /> Move Up
              </button>
              <button
                onClick={() => moveSlide(currentSlide, 'down')}
                disabled={currentSlide === slides.length - 1}
                className="flex-1 py-1.5 rounded bg-white/5 border border-white/10 text-[11px] text-white/70 hover:bg-white/10 disabled:opacity-30 flex items-center justify-center gap-1 cursor-pointer"
              >
                <ChevronDown size={12} /> Move Down
              </button>
              <button
                onClick={() => deleteSlide(currentSlide)}
                className="px-3 py-1.5 rounded bg-red-950/40 border border-red-500/20 text-[11px] text-red-400 hover:bg-red-950/60 cursor-pointer"
              >
                Delete
              </button>
            </div>

            <button
              onClick={addSlide}
              className="w-full py-2 rounded bg-white/5 border border-dashed border-white/20 text-xs text-white/70 hover:bg-white/10 cursor-pointer"
            >
              + Add Custom Slide
            </button>
          </section>
        )}

        {/* AI Slide deck Refiner Chat */}
        {slides.length > 0 && (
          <section className="space-y-3 border-t pt-4 border-white/5">
            <label style={{
              fontSize: '10px',
              letterSpacing: '2.5px',
              textTransform: 'uppercase',
              color: accentColor,
              display: 'block'
            }}>
              Refine Carousel with AI
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Make slide 3 focus on film grain..."
                value={chatRevision}
                onChange={(e) => setChatRevision(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border transition-all duration-200 focus:outline-none"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  borderColor: 'rgba(255,255,255,0.07)',
                  color: 'rgba(255,255,255,0.90)',
                  fontSize: '12px',
                  fontFamily: 'NeueKabelLight, sans-serif'
                }}
              />
              <button
                onClick={handleAiRefine}
                disabled={isGeneratingAi}
                className="px-3 py-2 rounded bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-bold text-white transition-all duration-200 cursor-pointer"
              >
                Refine
              </button>
            </div>
          </section>
        )}

        {/* Outside Content Import */}
        <section className="space-y-3 border-t pt-4 border-white/5">
          <button
            type="button"
            onClick={() => setShowOutsideImport(!showOutsideImport)}
            className="w-full py-2 rounded bg-white/5 border border-white/10 text-xs text-white/70 hover:bg-white/10 flex justify-between px-3 items-center cursor-pointer"
          >
            <span>Import Outside Slides JSON</span>
            <span className="text-[10px]">{showOutsideImport ? <ChevronUp size={12} /> : <ChevronDown size={12} />}</span>
          </button>
          {showOutsideImport && (
            <div className="space-y-3 pt-1 text-left">
              <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-2">
                <div className="text-[10px] font-bold uppercase tracking-wider text-white/70">
                  How to Structure Data
                </div>
                <div className="text-[11px] text-white/50 space-y-1.5 leading-normal">
                  <p>
                    Paste a raw JSON array of slide objects containing <code>type</code>, <code>headingText</code>, <code>subText</code> (optional), <code>keywords</code> (optional), <code>triggerWord</code> (optional), and <code>imageName</code> (optional) to link to uploaded files.
                  </p>
                </div>
              </div>

              <textarea
                placeholder="Paste JSON slide array here..."
                value={outsideContent}
                onChange={(e) => setOutsideContent(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 rounded-lg border transition-all duration-200 focus:outline-none resize-none"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  borderColor: 'rgba(255,255,255,0.05)',
                  color: 'rgba(255,255,255,0.80)',
                  fontSize: '12px',
                  fontFamily: 'NeueKabelLight, sans-serif'
                }}
              />
              <button
                onClick={handleImportOutsideContent}
                className="w-full py-2 rounded bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-bold text-white transition-all duration-200 cursor-pointer"
              >
                Import Slide JSON
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
