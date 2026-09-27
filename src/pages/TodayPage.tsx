import React, { useState } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Play, Flame, Layers, Dumbbell, Trophy, ArrowRight } from 'lucide-react';
import { OnboardingModal } from './OnboardingModal';
import { formatWeight } from '../lib/units';

export const TodayPage: React.FC = () => {
  const { splits, activeSplit, exercises, sessions, startWorkout, activeWorkout } = useWorkout();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState<boolean>(splits.length === 0);

  const unit = profile?.weightUnit || 'lbs';

  // Determine next scheduled day from active split
  const lastSession = sessions.length > 0 ? sessions[0] : null;

  let nextDayIndex = 0;
  if (activeSplit && activeSplit.days.length > 0 && lastSession?.dayId) {
    const lastDayIdx = activeSplit.days.findIndex((d) => d.id === lastSession.dayId);
    if (lastDayIdx !== -1) {
      nextDayIndex = (lastDayIdx + 1) % activeSplit.days.length;
    }
  }

  const nextScheduledDay = activeSplit && activeSplit.days.length > 0 ? activeSplit.days[nextDayIndex] : null;

  const plannedExercises = nextScheduledDay
    ? nextScheduledDay.exerciseIds
        .map((id) => exercises.find((e) => e.id === id))
        .filter((e): e is NonNullable<typeof e> => Boolean(e))
    : [];

  const handleStartWorkout = () => {
    if (activeWorkout) {
      navigate('/active');
      return;
    }

    if (activeSplit && nextScheduledDay) {
      startWorkout(activeSplit.id, nextScheduledDay.id, nextScheduledDay.name, plannedExercises);
    } else {
      startWorkout(undefined, undefined, 'Quick Workout', []);
    }
    navigate('/active');
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
      {/* Top Banner / Streak */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 font-sans">
            Today
          </h1>
          <p className="text-xs text-neutral-500 font-mono mt-0.5">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </div>

        {/* Streak Badge */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <Flame className="w-4 h-4 text-[#e8321c] fill-[#e8321c]" />
          <div className="text-right">
            <span className="text-[10px] uppercase font-mono text-neutral-400 block leading-tight">Streak</span>
            <span className="text-sm font-numeric font-bold text-neutral-900 dark:text-neutral-100">
              {profile?.streak || 0} {profile?.streak === 1 ? 'day' : 'days'}
            </span>
          </div>
        </div>
      </div>

      {/* Active Workout Resume Card (if in progress) */}
      {activeWorkout && (
        <div className="mb-6 p-4 rounded-xl border border-[#e8321c]/40 bg-[#e8321c]/5 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-[#e8321c] animate-ping" />
              <span className="text-xs font-mono uppercase text-[#e8321c] font-semibold">
                Workout in progress
              </span>
            </div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mt-1">
              {activeWorkout.dayName}
            </h3>
          </div>
          <button
            onClick={() => navigate('/active')}
            className="px-3.5 py-1.5 rounded-lg bg-[#e8321c] text-white text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            Resume
          </button>
        </div>
      )}

      {/* Main Focus: Next Scheduled Workout */}
      {activeSplit && nextScheduledDay ? (
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#121212] p-6 mb-8">
          <div className="flex items-center justify-between text-xs text-neutral-400 font-mono mb-2">
            <span>PROGRAM • {activeSplit.name}</span>
            <span>DAY {nextDayIndex + 1} OF {activeSplit.days.length}</span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 mb-4">
            {nextScheduledDay.name}
          </h2>

          {/* Planned Exercises List */}
          <div className="space-y-2 mb-6">
            {plannedExercises.length > 0 ? (
              plannedExercises.map((ex, i) => (
                <div
                  key={ex.id}
                  className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-800/60 last:border-none"
                >
                  <div className="flex items-center space-x-3">
                    <span className="font-numeric text-xs text-neutral-400 w-4">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                      {ex.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono uppercase text-neutral-400 px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800">
                    {ex.category}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-neutral-500 py-2">
                No exercises assigned to this day yet. You can add them in Splits or during the workout.
              </p>
            )}
          </div>

          {/* Start Workout Primary Button */}
          <button
            onClick={handleStartWorkout}
            className="w-full py-3.5 px-4 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-semibold text-xs tracking-wider uppercase hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Start {nextScheduledDay.name}</span>
          </button>
        </div>
      ) : (
        /* Empty State: Prompt to select or create Split */
        <div className="rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700 p-8 text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 mx-auto flex items-center justify-center text-neutral-600 dark:text-neutral-300 mb-3">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mb-1">
            No Active Split
          </h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto mb-4">
            Select a program template (like Push/Pull/Legs or Upper/Lower) or build your custom schedule.
          </p>
          <div className="flex items-center justify-center space-x-3">
            <button
              onClick={() => setShowOnboarding(true)}
              className="py-2.5 px-4 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold uppercase tracking-wide hover:opacity-90 transition-opacity"
            >
              Choose Template
            </button>
            <button
              onClick={() => {
                startWorkout(undefined, undefined, 'Free Workout', []);
                navigate('/active');
              }}
              className="py-2.5 px-4 rounded-xl border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-semibold uppercase tracking-wide hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Quick Workout
            </button>
          </div>
        </div>
      )}

      {/* Recent History / Stats preview */}
      {sessions.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400">
              Recent Session
            </h3>
            <button
              onClick={() => navigate('/history')}
              className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 flex items-center space-x-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#121212] flex items-center justify-between">
            <div>
              <div className="text-xs font-mono text-neutral-400">
                {new Date(sessions[0].startedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
              <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mt-0.5">
                {sessions[0].dayName}
              </div>
              <div className="text-[11px] font-mono text-neutral-500 mt-1 flex items-center space-x-3">
                <span>{sessions[0].totalSets} sets</span>
                <span>•</span>
                <span>{formatWeight(sessions[0].totalVolume, unit)} vol</span>
              </div>
            </div>

            {sessions[0].prsAchieved && sessions[0].prsAchieved.length > 0 && (
              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-[#e8321c]/10 text-[#e8321c] border border-[#e8321c]/30 text-xs font-mono font-medium">
                <Trophy className="w-3.5 h-3.5" />
                <span>{sessions[0].prsAchieved.length} PR{sessions[0].prsAchieved.length > 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Onboarding modal if triggered */}
      <OnboardingModal isOpen={showOnboarding} onClose={() => setShowOnboarding(false)} />
    </div>
  );
};
