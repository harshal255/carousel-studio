import React from 'react';
import { Heart, Bookmark, Send, MessageSquare, ArrowRight } from 'lucide-react';
import { Slide } from '../../../types';
import { useWorkspace } from '../../../context/WorkspaceContext';
import { renderTextWithAccent, getAccentTintGradient, isVideoUrl } from '../../../utils/helpers';

interface SlideFrameProps {
  slide: Slide;
  index: number;
  isExport?: boolean;
  interactive?: boolean;
  onPanStart?: (e: React.MouseEvent) => void;
  onPanMove?: (e: React.MouseEvent) => void;
  onPanEnd?: () => void;
}

export const SlideFrame: React.FC<SlideFrameProps> = ({
  slide,
  index,
  isExport = false,
  interactive = false,
  onPanStart,
  onPanMove,
  onPanEnd
}) => {
  const {
    accentColor,
    gradientHeight,
    showWordmark,
    logoMode,
    logoUrl,
    logoWidth,
    logoOpacity,
    brandName,
    setBrandName,
    niche,
    setNiche,
    bottomPadding,
    fontSize,
    viewMode,
    currentSlide,
    slides,
    setSlides,
    carouselSize,
    getHeadingFont,
    getBodyFont
  } = useWorkspace();

  const headingFont = getHeadingFont();
  const bodyFont = getBodyFont();
  const totalSlides = slides.length;

  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    if (isExport || !interactive) return;
    if (videoRef.current) {
      videoRef.current.play().catch(err => {
        console.log("Playback of unmuted video blocked, waiting for user interaction:", err);
      });
    }
  }, [slide.imageUrl, isExport, interactive]);

  const renderCtaContent = (targetSlide: Slide, exportMode: boolean = false) => {
    const layout = targetSlide.ctaLayout || 'comment';

    // Scale parameters
    const gapClass = exportMode ? "gap-6 mt-6" : "gap-2.5 mt-1";
    const cardPadding = exportMode ? "p-8 rounded-3xl" : "p-3.5 rounded-xl";
    const cardGap = exportMode ? "gap-2" : "gap-0.5";
    const iconSize = exportMode ? 44 : 18;
    const titleSize = exportMode ? "30px" : "12px";
    const subSize = exportMode ? "22px" : "9px";

    if (layout === 'comment') {
      return (
        <div className="flex flex-col items-start" style={{ gap: exportMode ? '24px' : '12px', width: '100%' }}>
          {exportMode ? (
            <div
              className="px-14 py-7 rounded-full border flex items-center justify-center gap-5 mt-4"
              style={{
                backgroundColor: 'rgba(255,255,255,0.12)',
                borderColor: 'rgba(255,255,255,0.25)',
              }}
            >
              <span style={{
                fontFamily: 'GilroyBold, sans-serif',
                fontSize: '32px',
                letterSpacing: '5px',
                textTransform: 'uppercase',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <MessageSquare size={36} className="text-white animate-pulse" />
                Comment "{targetSlide.triggerWord || 'STUDIO'}"
              </span>
            </div>
          ) : (
            <div
              className="px-6 py-3 rounded-full border flex items-center justify-center gap-2 mt-1"
              style={{
                backgroundColor: 'rgba(255,255,255,0.12)',
                borderColor: 'rgba(255,255,255,0.25)',
              }}
            >
              <span className="flex items-center gap-2" style={{
                fontFamily: 'GilroyBold, sans-serif',
                fontSize: '13px',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                color: 'white'
              }}>
                <MessageSquare size={16} className="text-white animate-pulse" />
                {interactive && viewMode === 'single' && currentSlide === index ? (
                  <span className="flex items-center">
                    Comment "
                    <input
                      type="text"
                      value={targetSlide.triggerWord || 'STUDIO'}
                      onChange={(e) => {
                        const newSlides = [...slides];
                        newSlides[index].triggerWord = e.target.value.toUpperCase();
                        setSlides(newSlides);
                      }}
                      className="bg-transparent border-none outline-none focus:ring-0 p-0 m-0 text-white font-bold text-center overflow-hidden"
                      style={{
                        fontFamily: 'GilroyBold, sans-serif',
                        fontSize: '13px',
                        letterSpacing: '2px',
                        textTransform: 'uppercase',
                        width: `calc(${(targetSlide.triggerWord || 'STUDIO').length}ch + ${(targetSlide.triggerWord || 'STUDIO').length * 2}px + 10px)`
                      }}
                    />
                    "
                  </span>
                ) : (
                  `Comment "${targetSlide.triggerWord || 'STUDIO'}"`
                )}
              </span>
            </div>
          )}

          <div style={{
            fontSize: exportMode ? '24px' : '10px',
            fontFamily: bodyFont,
            color: 'rgba(255,255,255,0.5)',
            letterSpacing: '1px'
          }}>
            All prompts sent directly to your DMs.
          </div>
        </div>
      );
    }

    if (layout === 'likesave') {
      return (
        <div className={`flex w-full ${gapClass}`}>
          {/* Like Card */}
          <div
            className={`flex-1 flex flex-col justify-center items-start border border-white/10 bg-white/5 backdrop-blur-sm ${cardPadding} ${cardGap}`}
          >
            <Heart size={iconSize} fill="#FF304F" className="text-[#FF304F]" />
            <div style={{ fontFamily: 'GilroyBold, sans-serif', fontSize: titleSize, color: 'white', fontWeight: 'bold', letterSpacing: '0.5px', marginTop: exportMode ? '12px' : '4px' }}>
              Double Tap
            </div>
            <div style={{ fontFamily: bodyFont, fontSize: subSize, color: 'rgba(255,255,255,0.40)' }}>
              To show your support
            </div>
          </div>

          {/* Save Card */}
          <div
            className={`flex-1 flex flex-col justify-center items-start border border-white/10 bg-white/5 backdrop-blur-sm ${cardPadding} ${cardGap}`}
          >
            <Bookmark size={iconSize} fill={accentColor} style={{ color: accentColor }} />
            <div style={{ fontFamily: 'GilroyBold, sans-serif', fontSize: titleSize, color: 'white', fontWeight: 'bold', letterSpacing: '0.5px', marginTop: exportMode ? '12px' : '4px' }}>
              Save Post
            </div>
            <div style={{ fontFamily: bodyFont, fontSize: subSize, color: 'rgba(255,255,255,0.40)' }}>
              Reference for later
            </div>
          </div>
        </div>
      );
    }

    if (layout === 'sharesave') {
      return (
        <div className={`flex w-full ${gapClass}`}>
          {/* Share Card */}
          <div
            className={`flex-1 flex flex-col justify-center items-start border border-white/10 bg-white/5 backdrop-blur-sm ${cardPadding} ${cardGap}`}
          >
            <Send size={iconSize} className="text-white" />
            <div style={{ fontFamily: 'GilroyBold, sans-serif', fontSize: titleSize, color: 'white', fontWeight: 'bold', letterSpacing: '0.5px', marginTop: exportMode ? '12px' : '4px' }}>
              Share Post
            </div>
            <div style={{ fontFamily: bodyFont, fontSize: subSize, color: 'rgba(255,255,255,0.40)' }}>
              Send to fellow creators
            </div>
          </div>

          {/* Comment Card */}
          <div
            className={`flex-1 flex flex-col justify-center items-start border border-white/10 bg-white/5 backdrop-blur-sm ${cardPadding} ${cardGap}`}
          >
            <MessageSquare size={iconSize} className="text-white" />
            <div style={{ fontFamily: 'GilroyBold, sans-serif', fontSize: titleSize, color: 'white', fontWeight: 'bold', letterSpacing: '0.5px', marginTop: exportMode ? '12px' : '4px' }}>
              Comment
            </div>
            <div style={{ fontFamily: bodyFont, fontSize: subSize, color: 'rgba(255,255,255,0.40)' }}>
              Share your thoughts
            </div>
          </div>
        </div>
      );
    }

    if (layout === 'all') {
      const allPadding = exportMode ? "py-6 px-4 rounded-2xl" : "py-2.5 px-1 rounded-lg";
      const allIconSize = exportMode ? 36 : 14;
      const allTextSize = exportMode ? "20px" : "8px";
      const allGap = exportMode ? "gap-2" : "gap-1";

      const barItems = [
        { icon: <Heart size={allIconSize} fill="#FF304F" className="text-[#FF304F]" />, text: "Like" },
        { icon: <MessageSquare size={allIconSize} className="text-white" />, text: "Comment" },
        { icon: <Send size={allIconSize} className="text-white" />, text: "Share" },
        { icon: <Bookmark size={allIconSize} fill={accentColor} style={{ color: accentColor }} />, text: "Save" }
      ];

      return (
        <div className={`flex w-full ${exportMode ? 'gap-4 mt-6' : 'gap-1.5 mt-2'}`}>
          {barItems.map((item, idx) => (
            <div
              key={idx}
              className={`flex-1 flex flex-col items-center justify-center border border-white/10 bg-white/5 backdrop-blur-sm ${allPadding} ${allGap}`}
            >
              {item.icon}
              <span style={{ fontFamily: 'GilroyBold, sans-serif', fontSize: allTextSize, color: 'white', fontWeight: 'bold', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                {item.text}
              </span>
            </div>
          ))}
        </div>
      );
    }

    return null;
  };

  return (
    <div
      id={isExport ? `export-slide-${index}` : `preview-slide-${index}`}
      className="flex-shrink-0 snap-start snap-always border border-white/5"
      style={{
        width: isExport ? '1080px' : '420px',
        height: isExport
          ? (carouselSize === 'portrait' ? '1350px' : '1080px')
          : (carouselSize === 'portrait' ? '525px' : '420px'),
        backgroundColor: '#000',
        position: 'relative',
        overflow: 'hidden',
        scrollSnapAlign: 'start',
        scrollSnapStop: 'always'
      }}
    >
      {/* Background Image */}
      {slide.imageUrl && (
        <div
          onMouseDown={interactive ? onPanStart : undefined}
          onMouseMove={interactive ? onPanMove : undefined}
          onMouseUp={interactive ? onPanEnd : undefined}
          onMouseLeave={interactive ? onPanEnd : undefined}
          className={`absolute inset-0 w-full h-full select-none overflow-hidden ${interactive ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'}`}
        >
          {isVideoUrl(slide.imageUrl) ? (
            <video
              ref={videoRef}
              src={slide.imageUrl}
              className={`absolute inset-0 w-full h-full object-${slide.imageFit || 'cover'} pointer-events-none`}
              style={{
                transform: `scale(${slide.imageZoom ?? 1}) scaleX(${slide.imageFlipH ? -1 : 1}) scaleY(${slide.imageFlipV ? -1 : 1}) translate(${slide.imagePanX ?? 0}%, ${slide.imagePanY ?? 0}%) rotate(${slide.imageRotate ?? 0}deg)`,
                transformOrigin: 'center center',
                opacity: (slide.imageOpacity ?? 100) / 100
              }}
              autoPlay
              loop
              playsInline
              muted={isExport || !interactive}
            />
          ) : (
            <img
              src={slide.imageUrl}
              alt=""
              className={`absolute inset-0 w-full h-full object-${slide.imageFit || 'cover'} pointer-events-none`}
              style={{
                transform: `scale(${slide.imageZoom ?? 1}) scaleX(${slide.imageFlipH ? -1 : 1}) scaleY(${slide.imageFlipV ? -1 : 1}) translate(${slide.imagePanX ?? 0}%, ${slide.imagePanY ?? 0}%) rotate(${slide.imageRotate ?? 0}deg)`,
                transformOrigin: 'center center',
                opacity: (slide.imageOpacity ?? 100) / 100
              }}
            />
          )}
        </div>
      )}

      {/* Gradient Overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: getAccentTintGradient(accentColor, gradientHeight)
        }}
      />

      {/* Content Container */}
      <div
        className="absolute inset-0 flex flex-col justify-between"
        style={{ padding: isExport ? '82px' : '32px' }}
      >
        {/* Wordmark & Niche Header */}
        {showWordmark && (
          <div style={{
            fontSize: isExport ? '28px' : '11px',
            fontFamily: bodyFont,
            letterSpacing: isExport ? '8px' : '3px',
            textTransform: 'uppercase',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div className="flex items-center gap-2">
              {(logoMode === 'logo' || logoMode === 'both') && logoUrl && (
                <img
                  src={logoUrl}
                  alt="Logo"
                  style={{
                    height: 'auto',
                    width: isExport ? `${logoWidth * 2.5}px` : `${logoWidth}px`,
                    opacity: logoOpacity / 100,
                    objectFit: 'contain'
                  }}
                />
              )}
              {(logoMode === 'text' || logoMode === 'both') && (
                interactive ? (
                  <input
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    className="bg-transparent border-none outline-none focus:ring-0 p-0 m-0 text-white overflow-hidden"
                    style={{
                      fontSize: '11px',
                      fontFamily: bodyFont,
                      letterSpacing: '3px',
                      textTransform: 'uppercase',
                      width: `calc(${brandName.length}ch + ${brandName.length * 3}px + 15px)`
                    }}
                  />
                ) : (
                  <span>{brandName}</span>
                )
              )}
            </div>
            {niche && (
              <span className="flex items-center" style={{
                fontSize: isExport ? '23px' : '9px',
                color: accentColor,
                letterSpacing: isExport ? '5px' : '2px',
                borderLeft: '1px solid rgba(255,255,255,0.2)',
                paddingLeft: isExport ? '25px' : '10px'
              }}>
                {interactive ? (
                  <input
                    type="text"
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    className="bg-transparent border-none outline-none focus:ring-0 p-0 m-0 overflow-hidden"
                    style={{
                      fontSize: '9px',
                      color: accentColor,
                      letterSpacing: '2px',
                      textTransform: 'uppercase',
                      width: `calc(${niche.length}ch + ${niche.length * 2}px + 15px)`
                    }}
                  />
                ) : (
                  niche
                )}
              </span>
            )}
          </div>
        )}

        {/* Bottom Content Area */}
        <div className={isExport ? "space-y-16" : "space-y-6"} style={{ paddingBottom: `${bottomPadding}px` }}>
          {/* Cover Slide Title */}
          {slide.type === 'cover' && (
            interactive ? (
              <div className="grid w-full">
                <textarea
                  value={slide.headingText || ''}
                  onChange={(e) => {
                    const newSlides = [...slides];
                    newSlides[index].headingText = e.target.value;
                    setSlides(newSlides);
                  }}
                  className="w-full bg-transparent resize-none border-none outline-none focus:ring-0 p-0 m-0 overflow-hidden transparent-text-input"
                  style={{
                    fontSize: `${fontSize * 1.3}px`,
                    fontFamily: headingFont,
                    letterSpacing: '-1px',
                    lineHeight: '1.1',
                    gridArea: '1 / 1 / 2 / 2'
                  }}
                  placeholder="Type cover heading here..."
                  rows={1}
                />
                <div aria-hidden="true" style={{
                  fontSize: `${fontSize * 1.3}px`,
                  fontFamily: headingFont,
                  letterSpacing: '-1px',
                  lineHeight: '1.1',
                  gridArea: '1 / 1 / 2 / 2',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  pointerEvents: 'none',
                  color: 'white'
                }}>
                  {renderTextWithAccent(slide.headingText || '', accentColor, true)}
                </div>
              </div>
            ) : (
              <div style={{
                fontSize: isExport ? `${fontSize * 1.3 * 2.5}px` : `${fontSize * 1.3}px`,
                fontFamily: headingFont,
                letterSpacing: isExport ? '-2.5px' : '-1px',
                color: 'white',
                lineHeight: '1.1',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {renderTextWithAccent(slide.headingText, accentColor, true)}
              </div>
            )
          )}

          {/* Keywords pills for Breakdown slides */}
          {slide.type === 'keyword' && slide.keywords && (
            <div className="flex flex-wrap gap-2">
              {slide.keywords.map((kw, idx) => (
                <div
                  key={idx}
                  className="border flex items-center"
                  style={{
                    borderColor: `${accentColor}50`,
                    backgroundColor: `${accentColor}10`,
                    backdropFilter: 'blur(10px)',
                    fontSize: isExport ? '23px' : '9px',
                    letterSpacing: isExport ? '5px' : '2px',
                    padding: isExport ? '8px 24px' : '4px 12px',
                    borderRadius: isExport ? '999px' : '999px',
                    textTransform: 'uppercase',
                    fontFamily: bodyFont,
                    color: accentColor
                  }}
                >
                  {interactive ? (
                    <input
                      type="text"
                      value={kw}
                      onChange={(e) => {
                        const newSlides = [...slides];
                        const updatedKeywords = [...(newSlides[index].keywords || [])];
                        updatedKeywords[idx] = e.target.value;
                        newSlides[index].keywords = updatedKeywords;
                        setSlides(newSlides);
                      }}
                      className="bg-transparent border-none outline-none focus:ring-0 p-0 m-0 text-center overflow-hidden"
                      style={{
                        fontSize: '9px',
                        letterSpacing: '2px',
                        textTransform: 'uppercase',
                        fontFamily: bodyFont,
                        width: `calc(${kw.length}ch + ${kw.length * 2}px + 10px)`,
                        color: accentColor
                      }}
                    />
                  ) : (
                    kw
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Heading Text */}
          {slide.type === 'keyword' && (
            interactive ? (
              <div className="flex flex-col gap-4 w-full">
                <div className="grid w-full">
                  <textarea
                    value={slide.headingText || ''}
                    onChange={(e) => {
                      const newSlides = [...slides];
                      newSlides[index].headingText = e.target.value;
                      setSlides(newSlides);
                    }}
                    className="w-full bg-transparent resize-none border-none outline-none focus:ring-0 p-0 m-0 overflow-hidden transparent-text-input"
                    style={{
                      fontSize: `${fontSize}px`,
                      fontFamily: headingFont,
                      letterSpacing: '-0.5px',
                      lineHeight: '1.2',
                      gridArea: '1 / 1 / 2 / 2'
                    }}
                    placeholder="Type bold statement..."
                    rows={1}
                  />
                  <div aria-hidden="true" style={{
                    fontSize: `${fontSize}px`,
                    fontFamily: headingFont,
                    letterSpacing: '-0.5px',
                    lineHeight: '1.2',
                    gridArea: '1 / 1 / 2 / 2',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    pointerEvents: 'none',
                    color: 'white'
                  }}>
                    {renderTextWithAccent(slide.headingText || '', accentColor, true)}
                  </div>
                </div>
                <div className="grid w-full">
                  <textarea
                    value={slide.subText || ''}
                    onChange={(e) => {
                      const newSlides = [...slides];
                      newSlides[index].subText = e.target.value;
                      setSlides(newSlides);
                    }}
                    className="w-full bg-transparent resize-none border-none outline-none focus:ring-0 p-0 m-0 overflow-hidden transparent-text-input"
                    style={{
                      fontSize: `${fontSize * 0.56}px`,
                      fontFamily: bodyFont,
                      lineHeight: '1.5',
                      gridArea: '1 / 1 / 2 / 2'
                    }}
                    placeholder="Type detailed explanation here..."
                    rows={1}
                  />
                  <div aria-hidden="true" style={{
                    fontSize: `${fontSize * 0.56}px`,
                    fontFamily: bodyFont,
                    lineHeight: '1.5',
                    gridArea: '1 / 1 / 2 / 2',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    pointerEvents: 'none',
                    color: 'rgba(255,255,255,0.7)'
                  }}>
                    {renderTextWithAccent(slide.subText || '', accentColor, true)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4 w-full">
                <div style={{
                  fontSize: isExport ? `${fontSize * 2.5}px` : `${fontSize}px`,
                  fontFamily: headingFont,
                  letterSpacing: isExport ? '-1.5px' : '-0.5px',
                  color: 'white',
                  lineHeight: '1.2',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {renderTextWithAccent(slide.headingText, accentColor, true)}
                </div>
                {slide.subText && (
                  <div style={{
                    fontSize: isExport ? `${fontSize * 0.56 * 2.5}px` : `${fontSize * 0.56}px`,
                    fontFamily: bodyFont,
                    color: 'rgba(255,255,255,0.7)',
                    lineHeight: '1.5',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}>
                    {renderTextWithAccent(slide.subText, accentColor, true)}
                  </div>
                )}
              </div>
            )
          )}

          {/* Reveal Slide */}
          {slide.type === 'reveal' && (
            <div className={isExport ? "space-y-8" : "space-y-3"}>
              <div style={{
                fontSize: isExport ? '25px' : '10px',
                fontFamily: bodyFont,
                letterSpacing: isExport ? '5px' : '2px',
                textTransform: 'uppercase',
                color: accentColor
              }}>
                Prompt Reveal
              </div>
              {interactive ? (
                <div className="grid w-full">
                  <textarea
                    value={slide.headingText || ''}
                    onChange={(e) => {
                      const newSlides = [...slides];
                      newSlides[index].headingText = e.target.value;
                      setSlides(newSlides);
                    }}
                    className="w-full bg-transparent resize-none border-none outline-none focus:ring-0 p-0 m-0 overflow-hidden transparent-text-input"
                    style={{
                      fontSize: '14px',
                      fontFamily: bodyFont,
                      lineHeight: '1.5',
                      height: '220px',
                      gridArea: '1 / 1 / 2 / 2'
                    }}
                    placeholder="Type prompt here..."
                  />
                  <div aria-hidden="true" style={{
                    fontSize: '14px',
                    fontFamily: bodyFont,
                    lineHeight: '1.5',
                    height: '220px',
                    gridArea: '1 / 1 / 2 / 2',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    pointerEvents: 'none',
                    color: 'rgba(255,255,255,0.9)',
                    overflow: 'hidden'
                  }}>
                    {renderTextWithAccent(slide.headingText || '', accentColor, true)}
                  </div>
                </div>
              ) : (
                <div style={{
                  fontSize: isExport ? '35px' : '14px',
                  fontFamily: bodyFont,
                  color: 'rgba(255,255,255,0.9)',
                  lineHeight: '1.5',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  maxHeight: isExport ? '550px' : '220px',
                  overflowY: 'auto'
                }}>
                  {renderTextWithAccent(slide.headingText, accentColor, true)}
                </div>
              )}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: isExport ? '20px' : '8px',
                marginTop: isExport ? '20px' : '8px'
              }}>
                <svg width={isExport ? 36 : 14} height={isExport ? 36 : 14} viewBox="0 0 24 24" fill="none">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                    stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" strokeLinecap="round"
                    strokeLinejoin="round" />
                </svg>
                <span style={{
                  fontFamily: bodyFont,
                  fontSize: isExport ? '25px' : '10px',
                  color: 'rgba(255,255,255,0.55)',
                  letterSpacing: '0.3px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>Get this prompt in your DM <ArrowRight size={isExport ? 20 : 10} /></span>
              </div>
            </div>
          )}

          {/* CTA Slide */}
          {slide.type === 'cta' && (
            <div className="space-y-4 flex flex-col items-start w-full">
              {interactive ? (
                <div className="grid w-full">
                  <textarea
                    value={slide.headingText || ''}
                    onChange={(e) => {
                      const newSlides = [...slides];
                      newSlides[index].headingText = e.target.value;
                      setSlides(newSlides);
                    }}
                    className="w-full bg-transparent resize-none border-none outline-none focus:ring-0 p-0 m-0 overflow-hidden transparent-text-input"
                    style={{
                      fontSize: `${fontSize}px`,
                      fontFamily: headingFont,
                      letterSpacing: '-0.5px',
                      lineHeight: '1.2',
                      gridArea: '1 / 1 / 2 / 2'
                    }}
                    placeholder="Type CTA heading here..."
                    rows={1}
                  />
                  <div aria-hidden="true" style={{
                    fontSize: `${fontSize}px`,
                    fontFamily: headingFont,
                    letterSpacing: '-0.5px',
                    lineHeight: '1.2',
                    gridArea: '1 / 1 / 2 / 2',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    pointerEvents: 'none',
                    color: 'white'
                  }}>
                    {renderTextWithAccent(slide.headingText || '', accentColor, true)}
                  </div>
                </div>
              ) : (
                <div style={{
                  fontSize: isExport ? `${fontSize * 2.5}px` : `${fontSize}px`,
                  fontFamily: headingFont,
                  letterSpacing: isExport ? '-1.5px' : '-0.5px',
                  color: 'white',
                  lineHeight: '1.2',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {renderTextWithAccent(slide.headingText, accentColor, true)}
                </div>
              )}

              {renderCtaContent(slide, isExport)}
            </div>
          )}

          {/* Progress Bar Component */}
          <div className={isExport ? "space-y-4" : "space-y-2"}>
            <div className={isExport ? "w-full h-1.5 rounded-full overflow-hidden" : "w-full h-0.5 rounded-full overflow-hidden"} style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${((index + 1) / totalSlides) * 100}%`,
                  backgroundColor: accentColor
                }}
              />
            </div>
            <div style={{
              fontSize: isExport ? '28px' : '11px',
              fontFamily: bodyFont,
              letterSpacing: isExport ? '3px' : '1px',
              color: 'rgba(255,255,255,0.6)'
            }}>
              {index + 1} / {totalSlides}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
