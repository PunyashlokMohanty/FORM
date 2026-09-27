import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useWorkout } from '../context/WorkoutContext';
import { WifiOff, Flame } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { profile, isOffline, toggleWeightUnit } = useAuth();
  const { activeWorkout } = useWorkout();
  const location = useLocation();

  return (
    <header className="sticky top-0 z-40 w-full bg-[#fafafa]/90 dark:bg-[#0a0a0a]/90 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800 transition-colors">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center space-x-2 text-inherit no-underline">
          <span className="font-bold tracking-tight text-lg text-neutral-900 dark:text-neutral-100 font-sans">
            FORM
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-neutral-900 dark:bg-neutral-100" />
        </Link>

        {/* Center / Offline Banner */}
        <div className="flex items-center space-x-3">
          {isOffline && (
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs">
              <WifiOff className="w-3.5 h-3.5" />
              <span>Offline — syncing when connected</span>
            </div>
          )}

          {activeWorkout && location.pathname !== '/active' && (
            <Link
              to="/active"
              className="flex items-center space-x-2 px-3 py-1 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-medium animate-pulse"
            >
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span>Workout Active</span>
            </Link>
          )}
        </div>

        {/* Right controls: Streak & Unit toggle */}
        <div className="flex items-center space-x-2">
          {profile && (
            <div className="flex items-center space-x-1 px-2 py-0.5 rounded text-xs font-mono font-medium text-neutral-700 dark:text-neutral-300">
              <Flame className="w-3.5 h-3.5 text-[#e8321c] fill-[#e8321c]" />
              <span className="text-neutral-900 dark:text-neutral-100">{profile.streak || 0}</span>
            </div>
          )}

          {/* Unit Toggle Button */}
          <button
            onClick={toggleWeightUnit}
            title="Toggle lbs / kg"
            className="px-2.5 py-1 text-xs font-mono font-semibold rounded border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-neutral-900 dark:hover:border-neutral-100 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors uppercase cursor-pointer"
          >
            {profile?.weightUnit || 'lbs'}
          </button>
        </div>
      </div>
    </header>
  );
};
