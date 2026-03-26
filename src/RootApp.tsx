import { useEffect, useState } from 'react';
import { Layers3, Sparkles } from 'lucide-react';
import LegacyApp from './App';
import PrototypeV2 from './PrototypeV2';

type ViewMode = 'v2' | 'legacy';

const STORAGE_KEY = 'ai_ad_ui_mode';

export default function RootApp() {
  const [mode, setMode] = useState<ViewMode>('v2');

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY) as ViewMode | null;
    if (saved === 'v2' || saved === 'legacy') {
      setMode(saved);
    }
  }, []);

  const handleModeChange = (nextMode: ViewMode) => {
    setMode(nextMode);
    window.localStorage.setItem(STORAGE_KEY, nextMode);
  };

  return (
    <div className="relative">
      {mode === 'v2' ? <PrototypeV2 /> : <LegacyApp />}

      <div className="fixed right-4 top-4 z-[60] rounded-[24px] border border-white/10 bg-black/60 p-2 shadow-[0_18px_50px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
        <div className="flex items-center gap-2 rounded-[18px] bg-white/[0.04] p-1">
          <button
            type="button"
            onClick={() => handleModeChange('v2')}
            className={`inline-flex items-center gap-2 rounded-[14px] px-4 py-2 text-sm transition ${
              mode === 'v2'
                ? 'bg-white text-[#050505] shadow-md'
                : 'text-white/64 hover:bg-white/[0.08]'
            }`}
          >
            <Sparkles size={14} />
            拍对
          </button>
          <button
            type="button"
            onClick={() => handleModeChange('legacy')}
            className={`inline-flex items-center gap-2 rounded-[14px] px-4 py-2 text-sm transition ${
              mode === 'legacy'
                ? 'bg-white text-[#050505] shadow-md'
                : 'text-white/64 hover:bg-white/[0.08]'
            }`}
          >
            <Layers3 size={14} />
            旧版
          </button>
        </div>
      </div>
    </div>
  );
}
