import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface PronounceButtonProps {
  text: string;
  lang?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const PronounceButton: React.FC<PronounceButtonProps> = ({
  text,
  lang = 'en-US',
  className = '',
  size = 'md',
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9;

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <button
      type="button"
      onClick={handleSpeak}
      title="Nghe phát âm chuẩn"
      className={`inline-flex items-center justify-center rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-indigo-600 focus:outline-none ${
        isPlaying ? 'text-indigo-600 ring-2 ring-indigo-500/30' : ''
      } ${className}`}
    >
      {isPlaying ? (
        <VolumeX className={`${iconSizes[size]} animate-pulse`} />
      ) : (
        <Volume2 className={iconSizes[size]} />
      )}
    </button>
  );
};

export default PronounceButton;
