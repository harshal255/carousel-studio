// Cookie helper functions
import React from 'react';

export const getCookie = (name: string): string => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || '';
  return '';
};

export const setCookie = (name: string, value: string, days = 365) => {
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value}; expires=${date.toUTCString()}; path=/`;
};

export const eraseCookie = (name: string) => {
  document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
};

// Helper to convert RGB to HSL for color analysis
export const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
};

// Helper to convert RGB to HEX string
export const rgbToHex = (r: number, g: number, b: number): string => {
  const clamp = (val: number) => Math.max(0, Math.min(255, val));
  return '#' + [clamp(r), clamp(g), clamp(b)].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('').toUpperCase();
};

// Helper to calculate distance between two colors to ensure visually distinct suggestions
export const colorDistance = (hex1: string, hex2: string): number => {
  const r1 = parseInt(hex1.slice(1, 3), 16);
  const g1 = parseInt(hex1.slice(3, 5), 16);
  const b1 = parseInt(hex1.slice(5, 7), 16);

  const r2 = parseInt(hex2.slice(1, 3), 16);
  const g2 = parseInt(hex2.slice(3, 5), 16);
  const b2 = parseInt(hex2.slice(5, 7), 16);

  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
};

// Main palette extractor using downsampled hidden canvas
export const extractColorsFromImage = (base64Url: string): Promise<string[]> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve([]);
        return;
      }

      // Downsample to 40x40 to run fast and smooth out noise
      canvas.width = 40;
      canvas.height = 40;
      ctx.drawImage(img, 0, 0, 40, 40);

      try {
        const imgData = ctx.getImageData(0, 0, 40, 40).data;
        const colorCounts: { [key: string]: number } = {};

        for (let i = 0; i < imgData.length; i += 4) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const a = imgData[i + 3];

          if (a < 128) continue; // Skip semi-transparent pixels

          const [h, s, l] = rgbToHsl(r, g, b);

          // Filter out near-black, near-white, and gray colors to capture premium accent colors
          if (l < 15 || l > 85 || s < 15) continue;

          // Quantize RGB values to group similar colors (round to nearest multiple of 16)
          const qr = Math.round(r / 16) * 16;
          const qg = Math.round(g / 16) * 16;
          const qb = Math.round(b / 16) * 16;

          const rgbKey = `${qr},${qg},${qb}`;
          colorCounts[rgbKey] = (colorCounts[rgbKey] || 0) + 1;
        }

        const sortedColors = Object.keys(colorCounts)
          .sort((a, b) => colorCounts[b] - colorCounts[a])
          .map(rgbStr => {
            const [r, g, b] = rgbStr.split(',').map(Number);
            return rgbToHex(r, g, b);
          });

        const distinctColors: string[] = [];
        for (const color of sortedColors) {
          if (distinctColors.length >= 6) break;
          const isDistinct = distinctColors.every(existingColor => {
            return colorDistance(color, existingColor) > 45;
          });
          if (isDistinct) {
            distinctColors.push(color);
          }
        }

        resolve(distinctColors);
      } catch (err) {
        console.error('Failed to extract colors:', err);
        resolve([]);
      }
    };
    img.onerror = () => resolve([]);
    img.src = base64Url;
  });
};

// Safe helper to build a premium background gradient tinted with the brand accent color
export const getAccentTintGradient = (color: string, height: number): string => {
  const isHex = /^#[0-9A-F]{6}$/i.test(color);
  const tint = isHex ? `${color}1E` : 'rgba(0,0,0,0.3)';
  return `linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, ${tint} ${height}%, rgba(0,0,0,0.98) 100%)`;
};

// Downscale large base64 image strings to keep IndexedDB updates lightweight and responsive
export const downscaleImage = (base64Url: string, maxDim: number = 512): Promise<string> => {
  return new Promise((resolve) => {
    if (!base64Url) {
      resolve(base64Url);
      return;
    }
    const img = new Image();
    if (!base64Url.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => {
      try {
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(base64Url);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      } catch (e) {
        console.error('Failed to downscale image:', e);
        resolve(base64Url);
      }
    };
    img.onerror = () => resolve(base64Url);
    img.src = base64Url;
  });
};

export const renderTextWithAccent = (text: string | undefined, accentColor: string, autoHighlight: boolean = false) => {
  if (!text) return null;
  const parts = text.split(/(\*\*?[^*]+\*\*?)/g);
  const hasMarkers = parts.some(p => p.startsWith('*') && p.endsWith('*') && p.length > 2);

  // Auto-highlight mode: if no markers found and autoHighlight is true, color the first 1-2 words
  if (!hasMarkers && autoHighlight) {
    const words = text.split(' ');
    const highlightCount = Math.min(2, Math.ceil(words.length / 3));
    const highlighted = words.slice(0, highlightCount).join(' ');
    const rest = words.slice(highlightCount).join(' ');
    return (
      <>
        <span style={{ color: accentColor }}>{highlighted}</span>
        {rest ? ' ' + rest : ''}
      </>
    );
  }

  return parts.map((part, idx) => {
    if (part.startsWith('*') && part.endsWith('*')) {
      const cleanText = part.replace(/\*/g, '');
      return (
        <span key={idx} style={{ color: accentColor }}>
          {cleanText}
        </span>
      );
    }
    return part;
  });
};

export const isVideoUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  if (url.startsWith('data:video/')) return true;
  const cleanUrl = url.split('?')[0].toLowerCase();
  return (
    cleanUrl.endsWith('.mp4') ||
    cleanUrl.endsWith('.webm') ||
    cleanUrl.endsWith('.ogg') ||
    cleanUrl.endsWith('.mov')
  );
};


