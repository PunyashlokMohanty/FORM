import React, { useEffect, useState, useRef } from 'react';
import { Volume2, VolumeX, X, Plus, Minus, Bell } from 'lucide-react';
import { playRestCompleteTone } from '../lib/audio';
import { useAuth } from '../context/AuthContext';

interface RestTimerBarProps {
  initialSeconds?: number;
  isOpen: boolean;
  onClose: () => void;
}

export const RestTimerBar: React.FC<RestTimerBarProps> = ({
  initialSeconds = 90,
  isOpen,
  onClose,
}) => {
  const { profile } = useAuth();
  const [secondsRemaining, setSecondsRemaining] = useState<number>(initialSeconds);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [muted, setMuted] = useState<boolean>(!(profile?.soundEnabled ?? true));
  const hasTriggeredAlert = useRef<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setSecondsRemaining(initialSeconds);
      setIsActive(true);
      hasTriggeredAlert.current = false;
    }
  }, [isOpen, initialSeconds]);

  useEffect(() => {
    if (!isOpen || !isActive) return;

    if (secondsRemaining <= 0) {
      if (!hasTriggeredAlert.current) {
        hasTriggeredAlert.current = true;
        playRestCompleteTone(!muted, profile?.vibrationEnabled ?? true);
      }
      return;
    }

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          if (!hasTriggeredAlert.current) {
            hasTriggeredAlert.current = true;
            playRestCompleteTone(!muted, profile?.vibrationEnabled ?? true);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, isActive, secondsRemaining, muted, profile?.vibrationEnabled]);

  if (!isOpen) return null;

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const isFinished = secondsRemaining === 0;

  return (
    <div className="fixed bottom-16 left-4 right-4 z-50 max-w-md mx-auto">
      <div
        className={`p-3 rounded-xl border backdrop-blur-md transition-all shadow-lg flex items-center justify-between ${
          isFinished
            ? 'bg-neutral-900 border-[#e8321c] text-white dark:bg-neutral-900 dark:border-[#e8321c]'
            : 'bg-white/95 dark:bg-neutral-900/95 border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100'
        }`}
      >
        {/* Left: Indicator & Time */}
        <div className="flex items-center space-x-3">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center font-mono ${
              isFinished ? 'bg-[#e8321c] text-white animate-bounce' : 'bg-neutral-100 dark:bg-neutral-800'
            }`}
          >
            <Bell className="w-4 h-4" />
          </div>

          <div>
            <div className="text-[10px] uppercase font-mono tracking-wider text-neutral-500 dark:text-neutral-400">
              {isFinished ? 'REST COMPLETED' : 'REST TIMER'}
            </div>
            <div className="text-xl font-numeric font-bold tracking-tight">
              {timeFormatted}
            </div>
          </div>
        </div>

        {/* Center/Right: Quick Adjust Controls */}
        <div className="flex items-center space-x-1.5">
          {!isFinished ? (
            <>
              <button
                onClick={() => setSecondsRemaining((s) => Math.max(0, s - 15))}
                title="Subtract 15s"
                className="px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-mono font-medium transition-colors"
              >
                -15s
              </button>

              <button
                onClick={() => setSecondsRemaining((s) => s + 30)}
                title="Add 30s"
                className="px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-mono font-medium transition-colors"
              >
                +30s
              </button>
            </>
          ) : (
            <span className="text-xs font-mono font-semibold text-[#e8321c]">Ready for next set</span>
          )}

          {/* Mute Toggle */}
          <button
            onClick={() => setMuted((m) => !m)}
            title={muted ? 'Unmute' : 'Mute'}
            className="p-1.5 rounded text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
          >
            {muted ? <VolumeX className="w-4 h-4 text-neutral-400" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Close / Skip */}
          <button
            onClick={onClose}
            title="Dismiss timer"
            className="p-1.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
