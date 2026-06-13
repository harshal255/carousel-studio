import React, { useRef, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useWorkspace } from '../../../context/WorkspaceContext';
import { SlideFrame } from './SlideFrame';

export const SlideCanvas: React.FC = () => {
  const {
    slides,
    setSlides,
    currentSlide,
    setCurrentSlide,
    viewMode,
    setViewMode,
    accentColor,
    carouselSize
  } = useWorkspace();

  const totalSlides = slides.length;
  const currentSlideData = slides[currentSlide];

  const canvasParentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [containerHeight, setContainerHeight] = useState(600);

  useEffect(() => {
    const container = canvasParentRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        const height = entry.contentRect.height;
        setContainerHeight(height);
        
        // Leave horizontal buffer (16px on each side for mobile, 24px on desktop)
        const horizontalBuffer = width < 640 ? 32 : 48;
        const availableWidth = width - horizontalBuffer;
        
        // Leave vertical buffer (90px on small screens, 110px on desktop)
        const verticalBuffer = height < 600 ? 90 : 110;
        const slideHeight = carouselSize === 'portrait' ? 525 : 420;
        const availableHeight = height - verticalBuffer;

        const scaleW = availableWidth / 420;
        const scaleH = availableHeight / slideHeight;
        
        const finalScale = Math.min(1, scaleW, scaleH);
        setScale(Math.max(0.38, finalScale));
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [carouselSize]);

  // Swipe view scrolling & drag refs
  const swipeContainerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const isProgrammaticScrollRef = useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    const container = swipeContainerRef.current;
    if (!container) return;
    isDraggingRef.current = true;
    isProgrammaticScrollRef.current = false;
    startXRef.current = e.pageX - container.offsetLeft;
    scrollLeftRef.current = container.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    e.preventDefault();
    const container = swipeContainerRef.current;
    if (!container) return;
    const x = e.pageX - container.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    container.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
  };

  const handleSwipeScroll = () => {
    const container = swipeContainerRef.current;
    if (!container) return;
    const scrollPos = container.scrollLeft;

    if (isProgrammaticScrollRef.current) {
      const targetLeft = currentSlide * 420;
      if (Math.abs(scrollPos - targetLeft) < 5) {
        isProgrammaticScrollRef.current = false;
      }
      return;
    }

    const newIndex = Math.round(scrollPos / 420);
    if (newIndex >= 0 && newIndex < slides.length && newIndex !== currentSlide) {
      setCurrentSlide(newIndex);
    }
  };

  // Sync scroll position when active slide changes or when entering swipe view mode
  useEffect(() => {
    if (viewMode === 'swipe' && swipeContainerRef.current && !isDraggingRef.current) {
      const container = swipeContainerRef.current;
      const targetLeft = currentSlide * 420;
      if (Math.abs(container.scrollLeft - targetLeft) > 10) {
        isProgrammaticScrollRef.current = true;
        container.scrollTo({
          left: targetLeft,
          behavior: 'smooth'
        });
      } else {
        isProgrammaticScrollRef.current = false;
      }
    }
  }, [viewMode, currentSlide]);

  // Image drag pan refs
  const isPanningRef = useRef(false);
  const panStartXRef = useRef(0);
  const panStartYRef = useRef(0);
  const initialPanXRef = useRef(0);
  const initialPanYRef = useRef(0);

  const handlePanStart = (e: React.MouseEvent) => {
    if (viewMode !== 'single') return;
    const slide = slides[currentSlide];
    if (!slide || !slide.imageUrl) return;

    isPanningRef.current = true;
    panStartXRef.current = e.clientX;
    panStartYRef.current = e.clientY;
    initialPanXRef.current = slide.imagePanX ?? 0;
    initialPanYRef.current = slide.imagePanY ?? 0;
  };

  const handlePanMove = (e: React.MouseEvent) => {
    if (!isPanningRef.current) return;
    const slide = slides[currentSlide];
    if (!slide) return;

    const deltaX = e.clientX - panStartXRef.current;
    const deltaY = e.clientY - panStartYRef.current;

    const width = 420;
    const height = carouselSize === 'portrait' ? 525 : 420;
    const zoom = slide.imageZoom ?? 1;
    const scaleFactor = 1.0 / zoom;

    const deltaPctX = (deltaX / width) * 100 * scaleFactor;
    const deltaPctY = (deltaY / height) * 100 * scaleFactor;

    const newSlides = [...slides];
    newSlides[currentSlide].imagePanX = Math.max(-150, Math.min(150, initialPanXRef.current + deltaPctX));
    newSlides[currentSlide].imagePanY = Math.max(-150, Math.min(150, initialPanYRef.current + deltaPctY));
    setSlides(newSlides);
  };

  const handlePanEnd = () => {
    isPanningRef.current = false;
  };

  return (
    <div 
      ref={canvasParentRef} 
      className={`flex-1 flex flex-col items-center bg-zinc-950 relative min-h-0 md:min-h-[600px] w-full transition-all duration-200 justify-start overflow-hidden`}
      style={{
        paddingTop: containerHeight < 500 ? '12px' : containerHeight < 680 ? '20px' : '32px',
        paddingBottom: containerHeight < 500 ? '12px' : containerHeight < 680 ? '20px' : '32px',
        paddingLeft: '16px',
        paddingRight: '16px'
      }}
    >
      {/* Top Segmented Mode Selector */}
      {slides.length > 0 && (
        <div 
          className="flex items-center p-1 rounded-xl border border-white/10 bg-[#121212]/90 backdrop-blur-md shadow-lg z-10 flex-shrink-0"
          style={{
            marginBottom: containerHeight < 500 ? '12px' : containerHeight < 680 ? '16px' : '24px'
          }}
        >
          <button
            onClick={() => setViewMode('single')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
              viewMode === 'single'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-white/40 hover:text-white/70'
            }`}
            title="Switch to Single View"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={viewMode === 'single' ? accentColor : 'currentColor'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="18" x="3" y="3" rx="2" />
            </svg>
            <span>Single View</span>
          </button>
          <button
            onClick={() => setViewMode('swipe')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
              viewMode === 'swipe'
                ? 'bg-white/10 text-white shadow-sm'
                : 'text-white/40 hover:text-white/70'
            }`}
            title="Switch to Continuous Spread"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={viewMode === 'swipe' ? accentColor : 'currentColor'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect width="7" height="18" x="3" y="3" rx="1" />
              <rect width="7" height="18" x="14" y="3" rx="1" />
            </svg>
            <span>Spread View</span>
          </button>
        </div>
      )}

      {slides.length === 0 ? (
        <div className="flex-1 flex items-center justify-center w-full">
          <div className="text-white/40 text-xs text-center p-8 border border-dashed border-white/10 rounded-2xl">
            Select a starter template or write a topic to load slides.
          </div>
        </div>
      ) : (
        /* Main Slide Canvas & Dots Group - Vertically Centered in remaining space */
        <div className="flex-grow flex-1 flex flex-col items-center justify-center w-full min-h-0 relative z-10">
          
          {/* Slide Frame wrappers container centered vertically for chevrons */}
          <div className="relative w-full flex items-center justify-center min-h-0">
            {/* Slide Frame wrapper */}
            {viewMode === 'swipe' ? (
              <div
                style={{
                  width: '100%',
                  maxWidth: '1000px',
                  height: `${(carouselSize === 'portrait' ? 525 : 420) * scale}px`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'visible',
                  position: 'relative'
                }}
              >
                <div
                  style={{
                    transform: `scale(${scale})`,
                    transformOrigin: 'center center',
                    width: `${100 / scale}%`,
                    maxWidth: `${1000 / scale}px`,
                    height: carouselSize === 'portrait' ? '525px' : '420px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <div className="relative w-full">
                    <div
                      ref={swipeContainerRef}
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUpOrLeave}
                      onMouseLeave={handleMouseUpOrLeave}
                      onScroll={handleSwipeScroll}
                      className="flex overflow-x-auto scrollbar-none snap-x snap-mandatory cursor-grab active:cursor-grabbing select-none"
                      style={{
                        width: '100%',
                        scrollBehavior: 'smooth',
                        gap: '0px'
                      }}
                    >
                      {slides.map((slide, index) => (
                        <SlideFrame key={slide.id} slide={slide} index={index} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  width: `${420 * scale}px`,
                  height: `${(carouselSize === 'portrait' ? 525 : 420) * scale}px`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'visible',
                  position: 'relative'
                }}
              >
                <div
                  style={{
                    transform: `scale(${scale})`,
                    transformOrigin: 'center center',
                    width: '420px',
                    height: carouselSize === 'portrait' ? '525px' : '420px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  {/* iPhone Frame */}
                  <div className="relative">
                    <div
                      className="rounded-3xl p-1"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
                        border: '1px solid rgba(255,255,255,0.15)'
                      }}
                    >
                      <div
                        className="rounded-2xl overflow-hidden relative"
                        style={{
                          width: '420px',
                          height: carouselSize === 'portrait' ? '525px' : '420px',
                          backgroundColor: '#000',
                          backfaceVisibility: 'hidden',
                          WebkitFontSmoothing: 'subpixel-antialiased'
                        }}
                      >
                        {currentSlideData && (
                          <SlideFrame
                            slide={currentSlideData}
                            index={currentSlide}
                            interactive
                            onPanStart={handlePanStart}
                            onPanMove={handlePanMove}
                            onPanEnd={handlePanEnd}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Global Slider Navigation Chevrons inside the slide wrapper viewport */}
            {slides.length > 0 && (
              <>
                <button
                  onClick={() => {
                    if (viewMode === 'single') {
                      setCurrentSlide((currentSlide - 1 + slides.length) % slides.length);
                    } else {
                      const prevIndex = Math.max(0, currentSlide - 1);
                      isProgrammaticScrollRef.current = true;
                      setCurrentSlide(prevIndex);
                    }
                  }}
                  disabled={viewMode === 'swipe' && currentSlide === 0}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 disabled:opacity-30 disabled:hover:scale-100 z-40 cursor-pointer bg-black/60 border border-white/10 hover:bg-black/80 text-white shadow-lg"
                  title="Previous Slide"
                >
                  <ChevronLeft style={{ width: '20px', height: '20px' }} />
                </button>

                <button
                  onClick={() => {
                    if (viewMode === 'single') {
                      setCurrentSlide((currentSlide + 1) % slides.length);
                    } else {
                      const nextIndex = Math.min(slides.length - 1, currentSlide + 1);
                      isProgrammaticScrollRef.current = true;
                      setCurrentSlide(nextIndex);
                    }
                  }}
                  disabled={viewMode === 'swipe' && currentSlide === slides.length - 1}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 disabled:opacity-30 disabled:hover:scale-100 z-40 cursor-pointer bg-black/60 border border-white/10 hover:bg-black/80 text-white shadow-lg"
                  title="Next Slide"
                >
                  <ChevronRight style={{ width: '20px', height: '20px' }} />
                </button>
              </>
            )}
          </div>

          {/* Pagination Dots */}
          {slides.length > 1 && (
            <div 
              className="flex items-center justify-center gap-2.5 z-10 transition-all duration-200"
              style={{
                marginTop: containerHeight < 500 ? '12px' : containerHeight < 680 ? '16px' : '24px'
              }}
            >
              {slides.map((_, idx) => {
                const isActive = currentSlide === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className="h-2 rounded-full transition-all duration-300 hover:opacity-100 cursor-pointer"
                    style={{
                      width: isActive ? '20px' : '8px',
                      backgroundColor: isActive ? accentColor : 'rgba(255, 255, 255, 0.2)',
                      boxShadow: isActive ? `0 0 8px ${accentColor}40` : 'none'
                    }}
                    title={`Go to slide ${idx + 1}`}
                  />
                );
              })}
            </div>
          )}

        </div>
      )}
    </div>
  );
};
