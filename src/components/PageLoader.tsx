import React, { useEffect, useState } from 'react';
import { Home } from 'lucide-react';

interface PageLoaderProps {
  onDone?: () => void;
}

export const PageLoader: React.FC<PageLoaderProps> = ({ onDone }) => {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => setLeaving(true), 1800);
    const doneTimer = window.setTimeout(() => onDone?.(), 2300);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <div
      className={`fixed inset-0 bg-[#0F172A] z-[9999] flex flex-col items-center justify-center transition-opacity duration-500 ${
        leaving ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className="w-16 h-16 rounded-2xl bg-[#C9922A] flex items-center justify-center animate-[logoIn_0.8s_ease-out_forwards]">
        <Home size={34} className="text-white" />
      </div>
      <div className="mt-5 text-white font-['Playfair_Display'] text-2xl font-bold opacity-0 animate-[fadeIn_0.6s_0.3s_ease-out_forwards]">
        My-Properties
      </div>
      <div className="mt-8 w-32 h-0.5 bg-[#C9922A]/30 rounded-full overflow-hidden">
        <div className="h-full bg-[#C9922A] animate-[loadBar_1.5s_ease-in-out_forwards]" />
      </div>
    </div>
  );
};
