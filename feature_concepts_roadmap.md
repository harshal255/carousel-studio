# Carousel Studio Roadmap: Top 10 Premium Features

This document outlines the high-value features, user experience concepts, and visual design systems proposed for the next iterations of **Carousel Studio**.

---

## 🚀 High-Impact Feature Matrix

| Priority | Feature / Concept | Description | Impact | Complexity |
| :---: | :--- | :--- | :---: | :---: |
| 🔥 **1** | **Direct Inline Canvas Text Editing** | Allow double-clicking on text inside the slide preview to edit it directly in place. | High | Medium |
| 🔥 **2** | **Slide Template Presets** | One-click presets (e.g., *Cyberpunk, Minimal Tech, Luxury Editorial, Corporate Clean*) to instantly change font pairings, colors, and graphics. | High | Low |
| ⚡ **3** | **Dynamic Palette Extractor** | Extract dominant colors from uploaded slide images and suggest them as matching gradient backgrounds or text accent colors. | Medium | Medium |
| ⚡ **4** | **Continuous Horizontal Swipe Preview** | Display slides side-by-side in a swipeable desktop slider to check how contiguous graphics flow across slides. | High | Medium |
| 🛠️ **5** | **Inline Image Cropper & Adjuster** | Inline zoom, rotation, and aspect ratio crop (Portrait/Square) directly in the workspace. | High | High |
| 🧠 **6** | **AI Prompt Enhancer (Super-Prompter)** | Automatically expand raw prompt concepts into hyper-detailed Midjourney/Nano Banana prompts. | High | Low |
| 📣 **7** | **Interactive CTA Library** | Premium visual CTA components like *Double Tap to Like, Save for Later, Share* with high-end vector icons. | Medium | Low |
| 💾 **8** | **Draft History & Local Autosave** | Automatically persist user's work to `LocalStorage`/`IndexedDB` so refreshing never loses progress. | High | Medium |
| 🎨 **9** | **Vector Logo & Wordmark Upload** | Let users upload a transparent SVG or PNG logo to overlay automatically at the corner of each slide. | Medium | Low |
| 🔗 **10** | **Direct Social Media Scheduling** | Integrate with publishing tools (Buffer/Hootsuite) or publish directly via the Instagram Content API. | High | High |

---

## 💡 Detailed Feature Descriptions

### 1. Direct Inline Canvas Text Editing
* **Concept**: Clicking on the slide preview starts a text focus state. Users edit headings, subheadings, and keyword tags directly on the slide instead of scrolling through the left control sidebar.
* **Why it matters**: Drastically reduces time-to-edit and provides a modern, Figma-like editor experience.

### 2. Slide Template Presets
* **Concept**: Introduce a sidebar menu for "Visual Styles." Selecting a preset (like *Premium Luxury* or *Cyberpunk*) changes the main font to Outfit/PT Mono, applies color schemes (neon vs. gold), and updates gradient opacity automatically.
* **Why it matters**: Helps non-designers get clean, professional looks instantly.

### 3. Dynamic Palette Extractor
* **Concept**: Utilize a fast Javascript library (like `color-thief-react` or custom canvas sampling) to fetch dominant colors from uploaded images when added to a slide.
* **Why it matters**: Guarantees visual harmony; titles and CTAs blend beautifully with background photography.

### 4. Continuous Horizontal Swipe Preview
* **Concept**: An alternative preview mode showing all slides linked side-by-side. Moving the mouse simulates a touch swipe, showing how the transition lines up.
* **Why it matters**: Creators love putting arrows and split graphics that span across slide boundaries. This ensures a seamless flow.

### 5. Inline Image Cropper & Adjuster
* **Concept**: A simple cropping modal using `react-image-crop` or canvas to center, zoom, and frame uploaded photos perfectly to `4:5` or `1:1`.
* **Why it matters**: Eliminates the need to crop images externally before uploading.

### 6. AI Prompt Enhancer (Super-Prompter)
* **Concept**: Send the raw prompt user input to the Gemini API with instructions to rewrite it with professional cinematic descriptors (e.g. *shot on Arri Alexa 65, anamorphic lens, high-fashion styling, natural side-lit shadow play*).
* **Why it matters**: Elevates basic prompts into jaw-dropping images.

### 7. Interactive CTA Library
* **Concept**: Beautifully designed layouts for the final slide. Users can pick from "Comment to get prompt", "Share with your designer", or "Save for later", each styled with premium graphic accents.
* **Why it matters**: Increases post engagement rates.

### 8. Draft History & Local Autosave
* **Concept**: Hook state changes into an auto-saving hook that saves to browser local storage. Include a "Load Draft" modal displaying thumbnails of past decks.
* **Why it matters**: Provides a safety net against browser crashes or accidental tab closures.

### 9. Vector Logo & Wordmark Upload
* **Concept**: In addition to typing a brand text name, let users upload a vector SVG or PNG. The app places it nicely as a watermark or footer emblem.
* **Why it matters**: Perfect for agency use and cohesive corporate branding.

### 10. Direct Social Media Scheduling
* **Concept**: Include a "Publish to Instagram" button that uses the Instagram Publishing API to schedule or publish the slide deck and the text caption immediately.
* **Why it matters**: Saves the creator from downloading files and manual uploads.
