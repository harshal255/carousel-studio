import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getCookie, setCookie, eraseCookie } from '../utils/helpers';

interface AiContextType {
  geminiApiKey: string;
  setGeminiApiKey: (key: string) => void;
  activeModel: string;
  setActiveModel: (model: string) => void;
  models: any[];
  setModels: (models: any[]) => void;
  isGeneratingAi: boolean;
  setIsGeneratingAi: (val: boolean) => void;
  handleClearToken: () => void;
}

const AiContext = createContext<AiContextType | undefined>(undefined);

export const AiProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [geminiApiKey, setGeminiApiKeyState] = useState(() => getCookie('gemini_api_key') || '');
  const [activeModel, setActiveModel] = useState(() => localStorage.getItem('carousel_studio_active_model') || 'gemma-4-31b-it');
  const [models, setModels] = useState<any[]>([]);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const setGeminiApiKey = (key: string) => {
    setGeminiApiKeyState(key);
    if (key) {
      setCookie('gemini_api_key', key);
    } else {
      eraseCookie('gemini_api_key');
    }
  };

  const handleClearToken = () => {
    setGeminiApiKeyState('');
    eraseCookie('gemini_api_key');
    setModels([]);
    toast.success('API Token cleared');
  };

  // Sync activeModel to localStorage
  useEffect(() => {
    localStorage.setItem('carousel_studio_active_model', activeModel);
  }, [activeModel]);

  // Fetch models dynamically when API key changes
  useEffect(() => {
    if (geminiApiKey) {
      const fetchModels = async () => {
        try {
          const cleanKey = geminiApiKey.trim().replace(/^['"]|['"]$/g, '');
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`
          );
          if (!response.ok) {
            let errorMsg = 'Failed to fetch models';
            try {
              const errJson = await response.json();
              errorMsg = errJson.error?.message || errorMsg;
            } catch (_) {}
            toast.error(`Gemini API Error: ${errorMsg}`);
            throw new Error(errorMsg);
          }
          const data = await response.json();
          const fetchedModels = (data.models || [])
            .filter((m: any) => {
              const name = m.name.toLowerCase();
              const isTextMultimodal = m.supportedGenerationMethods?.includes('generateContent');
              const isSpecialized = name.includes('image') ||
                                    name.includes('banana') ||
                                    name.includes('robotics') ||
                                    name.includes('tts') ||
                                    name.includes('lyria') ||
                                    name.includes('computer-use');
              return isTextMultimodal && !isSpecialized;
            })
            .map((m: any) => ({
              name: m.name.replace('models/', ''),
              label: m.displayName || m.name.replace('models/', '')
            }));

          // Deduplicate by displayName/label
          const uniqueModels: any[] = [];
          const seenLabels = new Set<string>();
          for (const model of fetchedModels) {
            if (!seenLabels.has(model.label)) {
              seenLabels.add(model.label);
              uniqueModels.push(model);
            }
          }
          setModels(uniqueModels);
        } catch (e: any) {
          console.warn('Failed to fetch models dynamically', e);
          toast.error(`Failed to load models: ${e.message || e}`);
        }
      };
      fetchModels();
    } else {
      setModels([]);
    }
  }, [geminiApiKey]);

  return (
    <AiContext.Provider
      value={{
        geminiApiKey,
        setGeminiApiKey,
        activeModel,
        setActiveModel,
        models,
        setModels,
        isGeneratingAi,
        setIsGeneratingAi,
        handleClearToken
      }}
    >
      {children}
    </AiContext.Provider>
  );
};

export const useAi = () => {
  const context = useContext(AiContext);
  if (!context) {
    throw new Error('useAi must be used within an AiProvider');
  }
  return context;
};
