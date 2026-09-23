import React, { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { soundEngine } from '../game/audio';

interface DialogueBoxProps {
  speakerName: string;
  speakerTitle: string;
  portraitIcon?: string;
  lines: string[];
  onFinish: () => void;
}

export const DialogueBox: React.FC<DialogueBoxProps> = ({
  speakerName,
  speakerTitle,
  portraitIcon = '🪡',
  lines,
  onFinish,
}) => {
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');

  const fullText = lines[currentLineIndex] || '';

  useEffect(() => {
    setDisplayedText('');
    let idx = 0;
    const interval = setInterval(() => {
      idx++;
      setDisplayedText(fullText.slice(0, idx));
      if (idx >= fullText.length) {
        clearInterval(interval);
      }
    }, 18);

    return () => clearInterval(interval);
  }, [currentLineIndex, fullText]);

  const handleNext = () => {
    if (displayedText.length < fullText.length) {
      // Instantly reveal text
      setDisplayedText(fullText);
      return;
    }

    if (currentLineIndex < lines.length - 1) {
      setCurrentLineIndex((prev) => prev + 1);
      soundEngine.playSlash('side');
    } else {
      onFinish();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['Space', 'Enter', 'KeyE', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [displayedText, fullText, currentLineIndex]);

  return (
    <div className="pointer-events-auto fixed inset-x-0 bottom-6 z-40 mx-auto w-full max-w-2xl px-4 select-none">
      <div
        onClick={handleNext}
        className="cursor-pointer rounded-xl border border-slate-700/90 bg-[#090e17]/95 p-5 shadow-2xl backdrop-blur-md transition-all hover:border-cyan-500/70"
      >
        <div className="flex items-start gap-4">
          {/* NPC Portrait / Icon */}
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-2xl shadow-inner">
            {portraitIcon}
          </div>

          {/* Dialogue Text Content */}
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <h4 className="font-display text-sm font-bold text-slate-100">
                {speakerName}
              </h4>
              <span className="text-[11px] text-cyan-400">
                · {speakerTitle}
              </span>
            </div>

            <p className="mt-2 min-h-[44px] text-sm leading-relaxed text-slate-200">
              {displayedText}
              {displayedText.length < fullText.length && (
                <span className="inline-block h-3 w-1.5 animate-pulse bg-cyan-400 ml-1" />
              )}
            </p>

            <div className="mt-2 flex items-center justify-end gap-1 text-[11px] text-slate-400">
              <span>Pressione [Espaço] ou clique para avançar</span>
              <ChevronRight className="h-3.5 w-3.5 text-cyan-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
