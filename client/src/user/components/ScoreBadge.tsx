import React from 'react';

interface ScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
}

export const ScoreBadge: React.FC<ScoreBadgeProps> = ({
  score,
  size = 'md',
  showLabel = false,
}) => {
  let colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let label = 'Xuất sắc';

  if (score < 60) {
    colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
    label = 'Cần luyện thêm';
  } else if (score < 80) {
    colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
    label = 'Khá tốt';
  } else if (score < 90) {
    colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
    label = 'Rất tốt';
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 font-semibold',
    md: 'text-sm px-2.5 py-1 font-semibold',
    lg: 'text-base px-3.5 py-1.5 font-bold',
    xl: 'text-2xl px-5 py-2.5 font-extrabold',
  };

  return (
    <div className="inline-flex items-center gap-1.5">
      <span
        className={`inline-flex items-center justify-center rounded-xl border ${colorClasses} ${sizeClasses[size]}`}
      >
        {score} / 100
      </span>
      {showLabel && (
        <span className="text-xs font-medium text-slate-600">({label})</span>
      )}
    </div>
  );
};

export default ScoreBadge;
