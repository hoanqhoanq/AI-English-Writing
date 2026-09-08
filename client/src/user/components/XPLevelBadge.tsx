import React from 'react';
import { Zap, Flame } from 'lucide-react';

interface XPLevelBadgeProps {
  xp: number;
  level: number;
  streak?: number;
  size?: 'sm' | 'md';
}

export const XPLevelBadge: React.FC<XPLevelBadgeProps> = ({ xp, level, streak, size = 'md' }) => {
  const isSmall = size === 'sm';

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 font-bold text-indigo-700 ${
          isSmall ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-sm'
        }`}
      >
        <Zap className={isSmall ? 'h-3.5 w-3.5 fill-indigo-500 text-indigo-500' : 'h-4 w-4 fill-indigo-500 text-indigo-500'} />
        Level {level} · {xp} XP
      </span>
      {typeof streak === 'number' && (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 font-bold text-amber-800 ${
            isSmall ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-1.5 text-sm'
          }`}
        >
          <Flame className={isSmall ? 'h-3.5 w-3.5 fill-amber-500 text-amber-500' : 'h-4 w-4 fill-amber-500 text-amber-500'} />
          {streak} ngày
        </span>
      )}
    </div>
  );
};

export default XPLevelBadge;
