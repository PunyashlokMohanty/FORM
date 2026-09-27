import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { PRAchievement } from '../types';
import { Trophy, ArrowUpRight, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatWeight } from '../lib/units';

interface PRCelebrationModalProps {
  prs: PRAchievement[];
  onClose: () => void;
}

export const PRCelebrationModal: React.FC<PRCelebrationModalProps> = ({ prs, onClose }) => {
  const { profile } = useAuth();
  const unit = profile?.weightUnit || 'lbs';

  useEffect(() => {
    if (prs.length > 0) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.65 },
          colors: ['#e8321c', '#ffffff', '#a3a3a3'],
          disableForReducedMotion: true,
        });
      } catch {
        // Safe fallback if canvas is not supported
      }
    }
  }, [prs]);

  if (!prs || prs.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-[#fafafa] dark:bg-[#121212] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-[#e8321c]/10 border border-[#e8321c]/30 flex items-center justify-center mb-4 text-[#e8321c]">
            <Trophy className="w-6 h-6 stroke-[2.2]" />
          </div>

          <span className="text-[11px] font-mono tracking-widest uppercase text-[#e8321c] font-bold">
            NEW PERSONAL RECORD{prs.length > 1 ? 'S' : ''}
          </span>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mt-1 mb-4">
            Outstanding Performance
          </h2>

          <div className="w-full space-y-2.5 my-2">
            {prs.map((pr, idx) => {
              let prLabel = 'Weight PR';
              let formattedVal = '';
              let prevFormatted = '';

              if (pr.prType === 'weight') {
                prLabel = 'Heaviest Weight';
                formattedVal = formatWeight(pr.value, unit);
                if (pr.previousValue && pr.previousValue > 0) {
                  prevFormatted = `prev ${formatWeight(pr.previousValue, unit)}`;
                }
              } else if (pr.prType === '1rm') {
                prLabel = 'Est. 1RM Max';
                formattedVal = formatWeight(pr.value, unit);
                if (pr.previousValue && pr.previousValue > 0) {
                  prevFormatted = `prev ${formatWeight(pr.previousValue, unit)}`;
                }
              } else if (pr.prType === 'reps') {
                prLabel = `Reps @ ${pr.weight ? formatWeight(pr.weight, unit) : ''}`;
                formattedVal = `${pr.value} reps`;
                if (pr.previousValue && pr.previousValue > 0) {
                  prevFormatted = `prev ${pr.previousValue} reps`;
                }
              }

              return (
                <div
                  key={idx}
                  className="p-3 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-left flex items-center justify-between"
                >
                  <div className="truncate mr-2">
                    <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                      {pr.exerciseName}
                    </div>
                    <div className="text-[10px] uppercase font-mono text-neutral-500">
                      {prLabel}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="flex items-center space-x-1 font-numeric font-bold text-neutral-900 dark:text-neutral-100 text-sm text-[#e8321c] dark:text-[#e8321c]">
                      <span>{formattedVal}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </div>
                    {prevFormatted && (
                      <div className="text-[10px] font-mono text-neutral-400">
                        {prevFormatted}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={onClose}
            className="w-full mt-4 py-2.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold text-xs tracking-wide uppercase hover:opacity-90 transition-opacity"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};
