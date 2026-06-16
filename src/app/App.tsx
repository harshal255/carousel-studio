import React from 'react';
import { Toaster } from 'react-hot-toast';
import { WorkspaceProvider, useWorkspace } from '../context/WorkspaceContext';
import { AiProvider } from '../context/AiContext';
import { SlideFrame } from '../features/canvas/components/SlideFrame';
import DashboardPage from '../pages/DashboardPage';
import EditorPage from '../pages/EditorPage';

function AppContent() {
  const { view, slides } = useWorkspace();

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

      {/* Pages Router */}
      {view === 'editor' ? <EditorPage /> : <DashboardPage />}

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
