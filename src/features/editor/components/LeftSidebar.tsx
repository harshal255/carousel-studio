import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronDown, ChevronRight, Upload, X, Sparkles, Folder, Key } from 'lucide-react';
import { toPng } from 'html-to-image';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import toast from 'react-hot-toast';
import { useWorkspace } from '../../../context/WorkspaceContext';
import { useAi } from '../../../context/AiContext';
import { extractColorsFromImage, colorDistance, downscaleImage, isVideoUrl } from '../../../utils/helpers';
import { Popover, PopoverTrigger, PopoverContent } from '../../../app/components/ui/popover';
import { ColorPicker } from '../../../app/components/ui/color-picker';
import { ImageFile, SavedDraft } from '../../../types';
import { draftDb } from '../../../db/draftDb';

export const LeftSidebar: React.FC = () => {
  const {
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
    generatedCaption,
    setGeneratedCaption,
    carouselSize,
    setCarouselSize,
    setDraftsModalOpen,
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
    handleSaveDraftSnapshot,
    getBodyFont,
    aiTool,
    setAiTool,
    showConfirm
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

  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const fontInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Sync suggested accent colors when images change
  useEffect(() => {
    const extractAllColors = async () => {
      if (images.length === 0) {
        setSuggestedPalette([]);
        return;
      }
      try {
        const palettes = await Promise.all(
          images.map(img => extractColorsFromImage(img.url))
        );
        const combinedColors = palettes.flat();
        const uniqueColors: string[] = [];
        for (const color of combinedColors) {
          if (uniqueColors.length >= 8) break;
          const isDistinct = uniqueColors.every(existingColor => {
            return colorDistance(color, existingColor) > 40;
          });
          if (isDistinct) {
            uniqueColors.push(color);
          }
        }
        setSuggestedPalette(uniqueColors);
      } catch (err) {
        console.error('Error extracting colors:', err);
      }
    };
    extractAllColors();
  }, [images]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const readPromises = files.map(file => {
      return new Promise<ImageFile>((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64Url = event.target?.result as string;
          resolve({
            id: Math.random().toString(36).substring(2, 6),
            url: base64Url,
            file,
            name: file.name
          });
        };
        reader.readAsDataURL(file);
      });
    });

    const newImages = await Promise.all(readPromises);
    setImages(prev => [...prev, ...newImages]);
    toast.success(`Uploaded ${files.length} files in sequence!`);
  };

  const removeImage = (id: string) => {
    setImages(images.filter(img => img.id !== id));
    toast.success('Removed image');
  };

  const moveImage = (index: number, direction: 'left' | 'right') => {
    if (direction === 'left' && index === 0) return;
    if (direction === 'right' && index === images.length - 1) return;
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    const newImages = [...images];
    const temp = newImages[index];
    newImages[index] = newImages[targetIndex];
    newImages[targetIndex] = temp;
    setImages(newImages);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (SVG, PNG, or JPG)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setLogoUrl(result);
      setLogoMode('logo');
      toast.success('Branding logo uploaded successfully!');
    };
    reader.onerror = () => {
      toast.error('Failed to read logo file');
    };
    reader.readAsDataURL(file);
  };

  const handleFontUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        const fontName = file.name.split('.')[0].replace(/[^a-zA-Z0-9]/g, '');

        const fontFace = new FontFace(fontName, arrayBuffer);
        const loadedFace = await fontFace.load();
        document.fonts.add(loadedFace);

        const dataUrlReader = new FileReader();
        dataUrlReader.onload = (e2) => {
          const dataUrl = e2.target?.result as string;
          const styleId = `font-style-${fontName}`;
          document.getElementById(styleId)?.remove();

          const ext = file.name.split('.').pop()?.toLowerCase();
          let formatStr = 'truetype';
          if (ext === 'otf') formatStr = 'opentype';
          else if (ext === 'woff') formatStr = 'woff';
          else if (ext === 'woff2') formatStr = 'woff2';

          const styleEl = document.createElement('style');
          styleEl.id = styleId;
          styleEl.textContent = `
            @font-face {
              font-family: "${fontName}";
              src: url("${dataUrl}") format("${formatStr}");
              font-weight: normal;
              font-style: normal;
            }
          `;
          document.head.appendChild(styleEl);
        };
        dataUrlReader.readAsDataURL(file);

        const id = Math.random().toString(36).substring(2, 11);
        setCustomFonts(prev => [...prev, { id, name: fontName }]);
        setFontStyle(`custom-${id}`);
        toast.success(`Custom font "${fontName}" added and applied!`);
      } catch (err) {
        console.error(err);
        toast.error('Failed to parse and load font file.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files).filter(
      file => file.type.startsWith('image/') || file.type.startsWith('video/')
    );
    if (files.length === 0) {
      toast.error('No valid images or videos dropped');
      return;
    }

    const readPromises = files.map(file => {
      return new Promise<ImageFile>((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64Url = event.target?.result as string;
          resolve({
            id: Math.random().toString(36).substring(2, 6),
            url: base64Url,
            file,
            name: file.name
          });
        };
        reader.readAsDataURL(file);
      });
    });

    const newImages = await Promise.all(readPromises);
    setImages(prev => [...prev, ...newImages]);
    toast.success(`Uploaded ${files.length} files in sequence!`);
  };

  const handleSuggestHooks = async () => {
    if (!geminiApiKey.trim()) {
      toast.error('Gemini API Key is required to suggest hooks.');
      return;
    }

    setIsGeneratingHooks(true);
    const toastId = toast.loading('Brainstorming 5 viral hook angles...');

    try {
      let imageParts: any[] = [];
      if (images.length > 0) {
        const imageOnlyList = images.filter(img => !isVideoUrl(img.url));
        imageParts = await Promise.all(
          imageOnlyList.map(img =>
            downscaleImage(img.url, 768).then(base64 => ({
              inlineData: {
                data: base64.split(',')[1],
                mimeType: 'image/jpeg'
              }
            }))
          )
        );
      }

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${sanitizeApiKey(geminiApiKey)}`;

      const promptText = `
You are the official prompts.page Instagram Carousel copywriter.
Based on the niche of AI image/video generation and creative AI workflows, generate exactly 5 highly-clickable hook variations.

Context available:
- Topic / Theme: "${topic || 'Not specified'}"
- AI Tool Used: "${aiTool || 'Not specified'}"
- Base AI Prompt: "${aiPrompt || 'Not specified'}"
${imageParts.length > 0 ? '- Images: ' + imageParts.length + ' reference images provided.' : ''}

Analyze the provided context (and images if attached) to craft the best hooks.
Make sure you generate exactly ONE hook for each of the 5 playbook angles: Shock/reveal, Aspirational, Clean/direct, Curiosity/secret, Contrarian.
Return ONLY a raw JSON array of objects. No markdown formatting.
[
  { "angle": "Shock/reveal", "hook": "The hook text here..." },
  { "angle": "Aspirational", "hook": "..." },
  { "angle": "Clean/direct", "hook": "..." },
  { "angle": "Curiosity/secret", "hook": "..." },
  { "angle": "Contrarian", "hook": "..." }
]
`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }, ...imageParts] }],
          generationConfig: { responseMimeType: 'application/json' }
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
      if (!textResponse) throw new Error('Empty response from API (blocked or empty content)');

      const parsed = cleanAndParseJson(textResponse);
      if (Array.isArray(parsed)) {
        setSuggestedHooks(parsed);
        toast.success('Hooks generated!', { id: toastId });
      } else {
        throw new Error('Invalid format');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(`Failed to generate hooks: ${err.message || err}`, { id: toastId });
    } finally {
      setIsGeneratingHooks(false);
    }
  };

  const handleAiGenerate = async () => {
    if (images.length === 0) {
      toast.error('Please upload at least one image first.');
      return;
    }
    if (!geminiApiKey.trim()) {
      toast.error('Gemini API Key is required.');
      return;
    }

    setIsGeneratingAi(true);
    const toastId = toast.loading('Downscaling images & preparing Gemini call...');

    try {
      const downscaledImages = await Promise.all(
        images.filter(img => !isVideoUrl(img.url)).map(async (img) => {
          const optimizedData = await downscaleImage(img.url, 512);
          return {
            url: optimizedData,
            name: img.file?.name || `image_${img.id}.jpg`
          };
        })
      );

      toast.loading('Analyzing visuals & structuring storytelling copy...', { id: toastId });

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${sanitizeApiKey(geminiApiKey)}`;

      const hasTopic = !!topic.trim();
      const hasPrompt = !!aiPrompt.trim();
      const keywordCount = hasPrompt
        ? Math.max(1, images.length - 2)
        : Math.max(1, images.length - 1);
      const totalExpectedSlides = hasPrompt ? (keywordCount + 2) : (keywordCount + 1);

      const imageInfoString = downscaledImages.map((img, i) => `- Image ${i + 1}: filename "${img.name}"`).join('\n');

      const parts: any[] = [
        {
          text: `
You are the official prompts.page Instagram Carousel copywriter and design strategist.
Analyze the provided topic, prompt (if any), and uploaded images to generate a high-performing storytelling Instagram carousel structure, along with a viral SEO storytelling Instagram caption and up to 30 relevant viral keywords.

Uploaded Image Filenames (in sequence):
${imageInfoString}

${hasTopic ? `Topic/Theme: "${topic}"` : 'Topic/Theme: Not specified (analyze the images and determine a suitable premium niche/topic autonomously)'}
${selectedHookText ? `Selected Final Hook for Slide 1: "${selectedHookText}"\nMake sure the Cover slide (Slide 1) strictly incorporates this exact angle and storytelling premise.` : ''}
${hasPrompt ? `AI Prompt: "${aiPrompt}"` : 'AI Prompt: None (do not generate a reveal slide)'}
AI Generator Tool Used to Generate Images: "${aiTool}"

There are ${images.length} images uploaded.
You must generate exactly ${totalExpectedSlides} slides in the 'slides' array:
1. Slide 1 (type: "cover"): Hook title about the topic (max 10 words). Maps to image 1.
2. Slides 2 to ${totalExpectedSlides - 1} (type: "keyword"): Generate exactly ${keywordCount} storytelling/keyword slides. Each slide must explain a unique key aesthetic term or style from the images/topic, matching the progression of intermediate images.
${hasPrompt ? `3. Slide ${totalExpectedSlides} (type: "reveal"): Holds the user's exact AI Prompt. You must use the user's original AI Prompt "${aiPrompt}" verbatim without altering, optimizing, or trimming it. Set this exact prompt as the 'headingText' of this slide.` : ''}
${hasPrompt ? `4. (CTA slide: keep this JSON to exactly ${totalExpectedSlides} slides matching the images, ending with type "cta").` : `3. (CTA slide: keep this JSON to exactly ${totalExpectedSlides} slides matching the images, ending with type "cta").`}

Follow these STRICT rules for the slide contents (prompts.page v2.7 guidelines):
- Niche Lock: Content must strictly stay within the AI image/video generation, prompt engineering, and creative AI workflow niche. Never drift off-niche.
- Slide 1 (Cover): The hook must use one of these angles: Shock/reveal, Aspirational, Clean/direct, Curiosity/secret, or Contrarian.
- Breakdown Slides (keywords): Identify key prompt terms (e.g. "medium-wide shot", "golden hour", "film grain"). The 'keywords' array must contain ONLY the raw terms (no connector words), max 3 per slide. The 'headingText' should be a punchy, bold statement (1 short sentence). The 'subText' should briefly explain what that term does.
- Prompt Reveal Slide: If a prompt is provided, this must contain the FULL prompt verbatim.
- CTA Slide: Headline must be italic-accented (e.g. "full prompt?"). The 'triggerWord' must be a short, memorable, uppercase word tied to the content (e.g., RAIN, NEON, DESERT).
- Text Highlighting (CRITICAL — NEVER SKIP THIS): Every single slide's 'headingText' and 'subText' MUST contain at least one word wrapped in single asterisks for accent coloring. Format: *word* or *two words*. This is MANDATORY. Examples: 'The *Golden Hour* technique', '*Cinematic* depth of field', 'Master *lighting ratios* fast'. Never generate any headingText or subText without at least one *asterisk-wrapped* word. Text without accent markers will appear purely white and break the design.
- Look at the attached images' color themes, mood, and style. Pick a matching 'accentColor' and 'fontStyle' ('editorial' | 'modern' | 'minimal').
- Image Mapping: For each slide (except for cta slides and slides with no image), you must populate the "imageName" field with the exact filename of the uploaded image that best corresponds to that slide's content.

Follow these STRICT rules for the caption output:
1. Single paragraph ONLY. No headings, no line breaks, no emojis, no bullet points.
2. Short, punchy copy. Lead with the hook, followed by a 1-sentence value prop, and a 1-sentence tease about the method/tool.
3. Explicitly reference that the images/prompt are created with "${aiTool}".
4. Must end exactly with: "Comment **[TRIGGER]** and I'll DM you the full prompt + details." (Replace [TRIGGER] with the actual triggerWord from the CTA slide).
5. Generate up to 30 comma-separated SEO/viral keywords inline at the very end of the paragraph. No hashtags. Keywords must only reference AI creative workflow terms and the tool used. NO competitor tool names unless explicitly mentioned.

Return ONLY a raw JSON object matching this TypeScript structure:
{
  "niche": "string (1-3 words niche label, e.g. 'Streetwear Fashion')",
  "accentColor": "string (hex code matching the prompt/images' color mood)",
  "fontStyle": "string ('editorial' | 'modern' | 'minimal')",
  "instagramCaption": "string (the single-paragraph caption ending with the comment CTA)",
  "viralKeywords": "string (comma-separated list of up to 30 SEO/viral keywords)",
  "slides": [
    { "type": "cover", "headingText": "The Storytelling Hook Title", "imageName": "filename of Image 1" },
    // Exactly ${keywordCount} keyword slides
    { "type": "keyword", "keywords": ["term1"], "headingText": "Punchy bold statement", "subText": "Detailed explanation of the term", "imageName": "filename of corresponding Image" },
    ...
    ${hasPrompt ? `{ "type": "reveal", "headingText": "${aiPrompt.replace(/"/g, '\\"')}", "imageName": null },` : ''}
    { "type": "cta", "headingText": "${hasPrompt ? 'Comment below to get this prompt' : 'Comment below to get this guide/cheatsheet'}", "triggerWord": "UPPERCASE_WORD", "imageName": null }
  ]
}
Do not wrap the output in markdown code blocks. Return only the raw JSON.
`
        }
      ];

      // Append base64 optimized images
      downscaledImages.forEach(img => {
        const base64Data = img.url.split(',')[1];
        const mimeType = img.url.split(';')[0].split(':')[1];
        parts.push({
          inlineData: {
            mimeType: mimeType,
            data: base64Data
          }
        });
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{ parts }],
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

      if (parsed.niche) setNiche(parsed.niche);
      if (parsed.accentColor) setAccentColor(parsed.accentColor);
      if (parsed.fontStyle) setFontStyle(parsed.fontStyle);

      if (parsed.instagramCaption) {
        const keywordsStr = parsed.viralKeywords || '';
        const fullCaption = `${parsed.instagramCaption.trim()} ${keywordsStr.trim()}`;
        setGeneratedCaption(fullCaption);
      }

      const newSlides = parsed.slides.map((s: any, idx: number) => {
        let imageUrl = undefined;
        if (s.imageName) {
          const matchedImg = images.find(img => img.file?.name === s.imageName);
          if (matchedImg) {
            imageUrl = matchedImg.url;
          }
        }
        if (imageUrl === undefined) {
          imageUrl = images[idx % images.length]?.url || undefined;
        }

        return {
          id: `slide-${idx}-${Math.random().toString(36).substring(2, 6)}`,
          type: s.type,
          keywords: s.keywords || [],
          headingText: s.type === 'reveal' ? aiPrompt : s.headingText,
          subText: s.subText,
          triggerWord: s.triggerWord,
          imageUrl
        };
      });

      setSlides(newSlides);
      setCurrentSlide(0);
      toast.success('Generated storytelling slide deck matching your images!', { id: toastId });
    } catch (err: any) {
      console.error(err);
      toast.error(`Failed to generate slides: ${err.message || err}`, { id: toastId });
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleDownload = async () => {
    if (slides.length === 0) {
      toast.error('Please generate or add slides first.');
      return;
    }
    setIsDownloading(true);
    setDownloadProgress('Preparing...');
    const toastId = toast.loading('Starting carousel export...');

    const zip = new JSZip();

    try {
      await document.fonts.ready;

      for (let i = 0; i < slides.length; i++) {
        setDownloadProgress(`Rendering ${i + 1}/${slides.length}...`);
        toast.loading(`Rendering slide ${i + 1}/${slides.length}...`, { id: toastId });

        const slideEl = document.getElementById(`export-slide-${i}`);
        if (!slideEl) continue;

        const dataUrl = await toPng(slideEl, {
          quality: 0.95,
          pixelRatio: 1,
          cacheBust: true,
        });

        const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
        zip.file(`slide-${i + 1}.png`, base64Data, { base64: true });
      }

      if (generatedCaption) {
        zip.file('caption_and_keywords.txt', generatedCaption);
      }

      setDownloadProgress('Compiling...');
      toast.loading('Compiling ZIP package...', { id: toastId });
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `${brandName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_carousel.zip`);
      toast.success('Export completed successfully!', { id: toastId });
      setDownloadProgress('');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export. Check logs.', { id: toastId });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="w-full h-full flex-shrink-0 overflow-y-auto custom-scrollbar editor-sidebar" style={{
      backgroundColor: '#111111'
    }}>
      <div className="p-6 space-y-6">
        {/* App Title & Navigation */}
        <div className="flex justify-between items-center border-b border-white/5 pb-4">
          <button
            onClick={() => {
              if (slides.length > 0) {
                showConfirm(
                  'Leave Editor',
                  'Are you sure you want to return to the Dashboard? Any unsaved edits will be lost.',
                  () => {
                    const url = new URL(window.location.href);
                    url.searchParams.delete('page');
                    url.searchParams.delete('id');
                    window.history.pushState(null, '', url.toString());
                    setView('dashboard');
                  }
                );
              } else {
                const url = new URL(window.location.href);
                url.searchParams.delete('page');
                url.searchParams.delete('id');
                window.history.pushState(null, '', url.toString());
                setView('dashboard');
              }
            }}
            className="flex items-center gap-1 text-xs text-white/60 hover:text-white transition-colors duration-150 font-bold cursor-pointer"
          >
            <ChevronLeft size={14} />
            <span>Dashboard</span>
          </button>

          <div style={{
            fontSize: '10px',
            fontFamily: 'NeueKabelLight, sans-serif',
            letterSpacing: '2.5px',
            textTransform: 'uppercase',
            color: accentColor
          }}>
            prompts.page Studio
          </div>
        </div>

        {/* Drafts Toolbar */}
        <div className="flex gap-2">
          <button
            onClick={handleSaveDraftSnapshot}
            className="flex-1 py-2 rounded bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] font-bold text-white uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
              <polyline points="17 21 17 13 7 13 7 21" />
              <polyline points="7 3 7 8 15 8" />
            </svg>
            Save Draft
          </button>
          <button
            onClick={() => setDraftsModalOpen(true)}
            className="flex-1 py-2 rounded bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] font-bold text-white uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-1.5"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            Draft History
          </button>
        </div>

        {/* Brand Setup */}
        <section className="space-y-3">
          <label style={{
            fontSize: '10px',
            letterSpacing: '2.5px',
            textTransform: 'uppercase',
            color: accentColor,
            display: 'block'
          }}>
            Brand Setup
          </label>
          <input
            type="text"
            placeholder="Brand Name"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border transition-all duration-200 focus:outline-none"
            style={{
              backgroundColor: 'rgba(255,255,255,0.04)',
              borderColor: 'rgba(255,255,255,0.07)',
              color: 'rgba(255,255,255,0.90)',
              fontSize: '13px',
              fontFamily: 'NeueKabelLight, sans-serif'
            }}
          />
          <input
            type="text"
            placeholder="Niche (e.g. AI Creative Studio)"
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border transition-all duration-200 focus:outline-none"
            style={{
              backgroundColor: 'rgba(255,255,255,0.04)',
              borderColor: 'rgba(255,255,255,0.07)',
              color: 'rgba(255,255,255,0.90)',
              fontSize: '13px',
              fontFamily: 'NeueKabelLight, sans-serif'
            }}
          />
          <div className="flex gap-2 items-center">
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="w-10 h-10 rounded cursor-pointer border"
                  style={{
                    backgroundColor: accentColor,
                    borderColor: 'rgba(255,255,255,0.07)'
                  }}
                />
              </PopoverTrigger>
              <PopoverContent className="w-72 bg-[#1C1C1C] border border-white/10 p-3">
                <ColorPicker
                  value={accentColor}
                  onChange={setAccentColor}
                  className="border-0 bg-transparent p-0 shadow-none w-full space-y-3"
                />
              </PopoverContent>
            </Popover>
            <input
              type="text"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border transition-all duration-200"
              style={{
                backgroundColor: 'rgba(255,255,255,0.04)',
                borderColor: 'rgba(255,255,255,0.07)',
                color: 'rgba(255,255,255,0.90)',
                fontSize: '13px',
                fontFamily: 'NeueKabelLight, sans-serif'
              }}
            />
          </div>

          {suggestedPalette.length > 0 && (
            <div className="space-y-2 pt-1 pb-1">
              <label style={{
                fontSize: '10px',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                color: accentColor,
                display: 'block',
                fontWeight: 'bold'
              }}>
                Suggested Accent Colors
              </label>
              <div className="flex flex-wrap gap-2">
                {suggestedPalette.map((color, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setAccentColor(color);
                      toast.success(`Applied accent color ${color}`);
                    }}
                    className="w-7 h-7 rounded-full border cursor-pointer transition-all duration-200 hover:scale-110 active:scale-95 flex items-center justify-center text-[10px] font-bold"
                    style={{
                      backgroundColor: color,
                      borderColor: accentColor.toUpperCase() === color.toUpperCase() ? '#ffffff' : 'rgba(255,255,255,0.15)',
                      boxShadow: accentColor.toUpperCase() === color.toUpperCase() ? `0 0 12px ${color}` : 'none'
                    }}
                    title={`Select ${color}`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Typography Selector */}
          <div className="relative space-y-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setFontDropdownOpen(!fontDropdownOpen)}
                className="w-full px-3 py-2 rounded-lg border transition-all duration-200 text-left flex justify-between items-center"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  borderColor: 'rgba(255,255,255,0.07)',
                  color: 'rgba(255,255,255,0.90)',
                  fontSize: '13px',
                  fontFamily: 'NeueKabelLight, sans-serif'
                }}
              >
                <span>
                  {fontStyle === 'editorial' && 'Editorial (Neue Kabel)'}
                  {fontStyle === 'modern' && 'Modern (Gilroy)'}
                  {fontStyle === 'minimal' && 'Minimal (Drowner + PT Mono)'}
                  {fontStyle.startsWith('custom-') && (customFonts.find(f => `custom-${f.id}` === fontStyle)?.name || 'Custom Font')}
                </span>
                <ChevronDown size={14} className="text-white/40" />
              </button>
              {fontDropdownOpen && (
                <div
                  className="absolute z-50 w-full mt-1 rounded-lg border shadow-xl overflow-hidden"
                  style={{
                    backgroundColor: '#1C1C1C',
                    borderColor: 'rgba(255,255,255,0.07)'
                  }}
                >
                  {[
                    { value: 'editorial', label: 'Editorial (Neue Kabel)' },
                    { value: 'modern', label: 'Modern (Gilroy)' },
                    { value: 'minimal', label: 'Minimal (Drowner + PT Mono)' },
                    ...customFonts.map(f => ({ value: `custom-${f.id}`, label: `${f.name} (Custom)` }))
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setFontStyle(opt.value);
                        setFontDropdownOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm transition-colors duration-150 text-white/80 hover:bg-white/5 hover:text-white"
                      style={{ fontFamily: 'NeueKabelLight, sans-serif' }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Upload Custom Font Button */}
            <button
              type="button"
              onClick={() => fontInputRef.current?.click()}
              className="w-full py-1.5 rounded border border-dashed text-xs transition-colors duration-150 hover:bg-white/5"
              style={{
                borderColor: 'rgba(255,255,255,0.15)',
                color: 'rgba(255,255,255,0.6)',
                fontFamily: 'NeueKabelLight, sans-serif'
              }}
            >
              + Add Custom Font (.ttf, .otf, .woff2)
            </button>
            <input
              ref={fontInputRef}
              type="file"
              accept=".ttf,.otf,.woff,.woff2"
              onChange={handleFontUpload}
              className="hidden"
            />
          </div>

          {/* Logo Setup Section */}
          <div className="space-y-3 pt-3 border-t border-white/5">
            <label style={{
              fontSize: '10px',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: accentColor,
              display: 'block',
              fontWeight: 'bold'
            }}>
              Branding Logo
            </label>

            <div className="flex gap-2 items-center">
              {logoUrl ? (
                <div className="flex items-center justify-between w-full p-2 bg-white/5 border border-white/10 rounded-lg">
                  <div className="flex items-center gap-2">
                    <img
                      src={logoUrl}
                      alt="Logo Preview"
                      className="h-8 w-8 object-contain rounded bg-zinc-950 p-0.5 border border-white/10"
                    />
                    <span className="text-[10px] text-white/60 font-bold uppercase tracking-wider">Logo Loaded</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setLogoUrl(null);
                      toast.success('Branding logo removed');
                    }}
                    className="p-1 rounded bg-red-950/20 border border-red-500/10 text-red-400 hover:bg-red-950/40 cursor-pointer flex items-center justify-center"
                    title="Remove Logo"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="w-full py-2 rounded border border-dashed text-xs transition-colors duration-150 hover:bg-white/5 flex items-center justify-center gap-1.5 cursor-pointer"
                  style={{
                    borderColor: 'rgba(255, 255, 255, 0.15)',
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontFamily: 'NeueKabelLight, sans-serif'
                  }}
                >
                  <Upload size={12} />
                  <span>Upload Logo (SVG, PNG, JPG)</span>
                </button>
              )}
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png, image/jpeg, image/svg+xml"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </div>

            {logoUrl && (
              <>
                {/* Branding Mode Selector */}
                <div className="space-y-1">
                  <span className="text-[11px] text-white/60">Display Layout</span>
                  <div className="flex gap-1.5 bg-white/5 p-1 rounded-lg border border-white/10">
                    {[
                      { mode: 'text', label: 'Text Only' },
                      { mode: 'logo', label: 'Logo Only' },
                      { mode: 'both', label: 'Logo + Text' }
                    ].map((opt) => (
                      <button
                        key={opt.mode}
                        type="button"
                        onClick={() => setLogoMode(opt.mode as any)}
                        className="flex-1 py-1 text-[9px] uppercase tracking-wider font-bold rounded transition-all duration-150 cursor-pointer"
                        style={{
                          backgroundColor: logoMode === opt.mode ? accentColor : 'transparent',
                          color: logoMode === opt.mode ? '#0A0A0A' : 'rgba(255,255,255,0.6)'
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Logo Size Slider */}
                {logoMode !== 'text' && (
                  <>
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-white/60">
                        <span>Logo Width</span>
                        <span>{logoWidth}px</span>
                      </div>
                      <input
                        type="range"
                        min="16"
                        max="80"
                        step="1"
                        value={logoWidth}
                        onChange={(e) => setLogoWidth(parseInt(e.target.value))}
                        className="w-full"
                        style={{ accentColor }}
                      />
                    </div>

                    {/* Logo Opacity Slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-white/60">
                        <span>Logo Opacity</span>
                        <span>{logoOpacity}%</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        step="5"
                        value={logoOpacity}
                        onChange={(e) => setLogoOpacity(parseInt(e.target.value))}
                        className="w-full"
                        style={{ accentColor }}
                      />
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </section>

        {/* Images Section */}
        <section className="space-y-3">
          <label style={{
            fontSize: '10px',
            letterSpacing: '2.5px',
            textTransform: 'uppercase',
            color: accentColor,
            display: 'block'
          }}>
            Images Gallery
          </label>
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed rounded-lg p-6 cursor-pointer transition-all duration-200 hover:border-opacity-30"
            style={{
              borderColor: 'rgba(255,255,255,0.15)',
              backgroundColor: 'rgba(255,255,255,0.02)'
            }}
          >
            <div className="flex flex-col items-center gap-2">
              <Upload style={{ color: 'rgba(255,255,255,0.40)', width: '20px', height: '20px' }} />
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.40)', textAlign: 'center' }}>
                Drop images/videos or click to upload
              </span>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          {images.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {images.map((img, idx) => (
                <div
                  key={img.id}
                  className="relative aspect-[4/5] rounded overflow-hidden group border border-white/10"
                  title={img.name || img.file?.name || 'Uploaded image'}
                >
                  {isVideoUrl(img.url) ? (
                    <video
                      src={img.url}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      muted
                      playsInline
                      autoPlay
                      loop
                    />
                  ) : (
                    <img
                      src={img.url}
                      alt=""
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />

                  {(() => {
                    const name = img.name || img.file?.name || `Image ${idx + 1}`;
                    const truncatedName = name.length > 15 ? name.substring(0, 12) + '...' : name;
                    return (
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/90 border border-white/10 text-[9px] text-white/90 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-30">
                        {idx + 1}. {truncatedName}
                      </div>
                    );
                  })()}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(img.id);
                    }}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center bg-black/75 hover:bg-red-500/90 text-white opacity-0 group-hover:opacity-100 transition-all duration-200 z-20"
                    title="Delete image"
                  >
                    <X style={{ width: '12px', height: '12px' }} />
                  </button>

                  {idx > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveImage(idx, 'left');
                      }}
                      className="absolute bottom-1.5 left-1.5 w-6 h-6 rounded-full flex items-center justify-center bg-black/75 hover:bg-white/20 text-white opacity-0 group-hover:opacity-100 transition-all duration-200 z-20"
                      title="Move left"
                    >
                      <ChevronLeft style={{ width: '14px', height: '14px' }} />
                    </button>
                  )}

                  {idx < images.length - 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveImage(idx, 'right');
                      }}
                      className="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center bg-black/75 hover:bg-white/20 text-white opacity-0 group-hover:opacity-100 transition-all duration-200 z-20"
                      title="Move right"
                    >
                      <ChevronRight style={{ width: '14px', height: '14px' }} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* AI Assistant Hook generator */}
        <div className="space-y-4 pt-4 border-t border-white/10">
          <div className="flex justify-between items-center">
            <label className="text-[10px] text-white/50 uppercase tracking-widest font-bold">Topic / Theme (Optional)</label>
            <button
              onClick={handleSuggestHooks}
              disabled={isGeneratingHooks}
              className="text-[10px] bg-white/10 hover:bg-white/20 text-white px-2 py-1.5 rounded transition-colors"
            >
              {isGeneratingHooks ? 'Brainstorming...' : (
                <span className="flex items-center gap-1">
                  Suggest 5 Hooks <Sparkles size={12} />
                </span>
              )}
            </button>
          </div>
          <textarea
            placeholder="e.g. Cinematic Streetwear Fashion (Optional)"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border transition-all duration-200 focus:outline-none resize-none"
            style={{
              backgroundColor: 'rgba(255,255,255,0.04)',
              borderColor: 'rgba(255,255,255,0.07)',
              color: 'rgba(255,255,255,0.90)',
              fontSize: '13px',
              fontFamily: 'NeueKabelLight, sans-serif'
            }}
          />
          {suggestedHooks.length > 0 && (
            <div className="space-y-2 mt-2">
              <label className="text-[10px] text-white/50 uppercase tracking-widest font-bold">Suggested Hooks (Click to select)</label>
              <div className="flex flex-col gap-1.5">
                {suggestedHooks.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedHookText(item.hook)}
                    className={`text-left text-xs p-2 rounded transition-all leading-snug flex flex-col gap-1 ${selectedHookText === item.hook
                      ? 'bg-white/20 border border-white/40 text-white shadow-lg'
                      : 'bg-white/5 hover:bg-white/15 border border-white/5 hover:border-white/20 text-white/90'
                      }`}
                  >
                    <span className="text-[9px] uppercase tracking-wider text-white/50 font-bold">{item.angle}</span>
                    <span>{item.hook}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2 mt-4 pt-2">
            <label className="text-[10px] text-white/50 uppercase tracking-widest font-bold">Selected / Final Hook</label>
            <textarea
              placeholder="Select a hook from above, or type your own hook here..."
              value={selectedHookText}
              onChange={(e) => setSelectedHookText(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border transition-all duration-200 focus:outline-none resize-none"
              style={{
                backgroundColor: 'rgba(255,255,255,0.08)',
                borderColor: 'rgba(255,255,255,0.2)',
                color: 'rgba(255,255,255,0.95)',
                fontSize: '13px',
                fontFamily: 'NeueKabelLight, sans-serif'
              }}
            />
          </div>
        </div>

        {/* AI Generator Tool Input */}
        <section className="space-y-2">
          <label style={{
            fontSize: '10px',
            letterSpacing: '2.5px',
            textTransform: 'uppercase',
            color: accentColor,
            display: 'block'
          }}>
            AI Generator Tool
          </label>
          <input
            type="text"
            placeholder="e.g. ChatGPT Images 2.0, Midjourney, Nano Banana 2"
            value={aiTool}
            onChange={(e) => setAiTool(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border transition-all duration-200 focus:outline-none"
            style={{
              backgroundColor: 'rgba(255,255,255,0.04)',
              borderColor: 'rgba(255,255,255,0.07)',
              color: 'rgba(255,255,255,0.90)',
              fontSize: '13px',
              fontFamily: 'NeueKabelLight, sans-serif'
            }}
          />
        </section>

        {/* AI Prompt Section & Gemini token configuration */}
        <section className="space-y-3">
          <label style={{
            fontSize: '10px',
            letterSpacing: '2.5px',
            textTransform: 'uppercase',
            color: accentColor,
            display: 'block'
          }}>
            AI Prompt (Optional)
          </label>
          <textarea
            placeholder="Paste your AI prompt here (Optional)..."
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border transition-all duration-200 focus:outline-none resize-none"
            style={{
              backgroundColor: 'rgba(255,255,255,0.04)',
              borderColor: 'rgba(255,255,255,0.07)',
              color: 'rgba(255,255,255,0.90)',
              fontSize: '13px',
              fontFamily: 'NeueKabelLight, sans-serif'
            }}
          />

          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg">
              <Key size={12} className="text-white/40" />
              <input
                type="password"
                placeholder="Gemini API Key"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                className="bg-transparent text-xs text-white placeholder-white/30 border-none outline-none w-full"
              />
            </div>

            {geminiApiKey && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                  className="w-full px-3 py-1.5 rounded-lg border transition-all duration-200 text-left flex justify-between items-center text-white/80"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    borderColor: 'rgba(255,255,255,0.05)',
                    fontSize: '11px',
                    fontFamily: 'NeueKabelLight, sans-serif'
                  }}
                >
                  <span className="truncate mr-2">
                    {models.find(m => m.name === activeModel)?.label || activeModel}
                  </span>
                  <ChevronDown size={12} className="text-white/40 flex-shrink-0" />
                </button>
                {modelDropdownOpen && (
                  <div
                    className="absolute z-[99] w-full mt-1 rounded-lg border shadow-2xl overflow-y-auto max-h-60"
                    style={{
                      backgroundColor: '#161616',
                      borderColor: 'rgba(255,255,255,0.07)'
                    }}
                  >
                    {models.length === 0 ? (
                      <div
                        className="px-3 py-2 text-xs text-white/40 text-center select-none"
                        style={{ fontFamily: 'NeueKabelLight, sans-serif' }}
                      >
                        No models loaded
                      </div>
                    ) : (
                      models.map(m => {
                        return (
                          <button
                            key={m.name}
                            type="button"
                            onClick={() => {
                              setActiveModel(m.name);
                              setModelDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-xs transition-colors duration-150 flex items-center justify-between border-b border-white/5 ${
                              activeModel === m.name
                                ? 'bg-white/10 text-white font-bold'
                                : 'text-white/60 hover:text-white hover:bg-white/5'
                            }`}
                            style={{
                              fontFamily: 'NeueKabelLight, sans-serif'
                            }}
                          >
                            <span className="truncate">{m.label || m.name}</span>
                            {activeModel === m.name && (
                              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: accentColor }} />
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleAiGenerate}
                disabled={isGeneratingAi}
                className="flex-1 py-2 rounded bg-white/10 hover:bg-white/15 border border-white/10 text-xs font-bold text-white transition-all duration-200 disabled:opacity-50"
              >
                {isGeneratingAi ? 'Analyzing...' : 'AI Assist (Gemini)'}
              </button>
              {geminiApiKey && (
                <button
                  onClick={handleClearToken}
                  className="px-3 py-2 rounded bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 text-xs font-bold text-red-400 transition-all duration-200"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Style Config Adjustments */}
        <section className="space-y-4 pt-4 border-t border-white/10">
          <label style={{
            fontSize: '10px',
            letterSpacing: '2.5px',
            textTransform: 'uppercase',
            color: accentColor,
            display: 'block'
          }}>
            Style Config
          </label>

          {/* Carousel Size / Aspect Ratio */}
          <div className="space-y-2">
            <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.60)' }}>
              Carousel Size / Aspect Ratio
            </label>
            <div className="flex gap-1 bg-white/5 p-0.5 rounded-lg border border-white/10">
              {(['portrait', 'square'] as const).map(size => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setCarouselSize(size)}
                  className="flex-1 py-1.5 text-[10px] capitalize rounded transition-all duration-150 font-bold"
                  style={{
                    backgroundColor: carouselSize === size ? accentColor : 'transparent',
                    color: carouselSize === size ? '#0A0A0A' : 'rgba(255,255,255,0.6)'
                  }}
                >
                  {size === 'portrait' ? 'Portrait (4:5)' : 'Square (1:1)'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.60)' }}>
              Gradient Height: {gradientHeight}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={gradientHeight}
              onChange={(e) => setGradientHeight(Number(e.target.value))}
              className="w-full cursor-pointer"
              style={{ accentColor }}
            />
          </div>
          <div className="space-y-2">
            <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.60)' }}>
              Font Size: {fontSize}px
            </label>
            <input
              type="range"
              min="16"
              max="36"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-full cursor-pointer"
              style={{ accentColor }}
            />
          </div>
          <div className="space-y-2">
            <label style={{ fontSize: '11px', color: 'rgba(255,255,255,0.60)' }}>
              Bottom Padding: {bottomPadding}px
            </label>
            <input
              type="range"
              min="5"
              max="80"
              value={bottomPadding}
              onChange={(e) => setBottomPadding(Number(e.target.value))}
              className="w-full cursor-pointer"
              style={{ accentColor }}
            />
          </div>
        </section>

        {/* Download Button */}
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="w-full py-3 rounded-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:scale-100"
          style={{
            backgroundColor: accentColor,
            color: '#0A0A0A',
            fontSize: '13px',
            fontFamily: 'NeueKabelBold, sans-serif',
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            boxShadow: `0 0 20px ${accentColor}40`,
            cursor: isDownloading ? 'not-allowed' : 'pointer'
          }}
        >
          {isDownloading ? downloadProgress : 'Download ZIP Carousel'}
        </button>
      </div>
    </div>
  );
};
