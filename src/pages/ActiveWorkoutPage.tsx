import React, { useState, useEffect } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  Plus,
  Trash2,
  Clock,
  History,
  AlertCircle,
  X,
  Search,
  Dumbbell,
  CheckCircle2,
} from 'lucide-react';
import { RestTimerBar } from '../components/RestTimerBar';
import { PRCelebrationModal } from '../components/PRCelebrationModal';
import { Exercise, WorkoutSet } from '../types';
import { toDisplayWeight, toStorageWeight, formatWeight } from '../lib/units';

export const ActiveWorkoutPage: React.FC = () => {
  const {
    activeWorkout,
    exercises,
    addSetToActive,
    updateActiveSet,
    removeActiveSet,
    addExerciseToActiveWorkout,
    removeExerciseFromActiveWorkout,
    finishWorkout,
    discardWorkout,
    getLastPerformance,
    latestPRs,
    clearLatestPRs,
  } = useWorkout();

  const { profile } = useAuth();
  const navigate = useNavigate();

  const unit = profile?.weightUnit || 'lbs';
  const defaultRest = profile?.defaultRestDuration || 90;

  // Rest Timer state
  const [isRestTimerOpen, setIsRestTimerOpen] = useState<boolean>(false);
  const [restTimerSeconds, setRestTimerSeconds] = useState<number>(defaultRest);

  // Reference "Last Time" popover modal
  const [lastTimeModalExercise, setLastTimeModalExercise] = useState<{
    name: string;
    sets: WorkoutSet[];
  } | null>(null);

  // Add Exercise picker modal
  const [isAddExerciseModalOpen, setIsAddExerciseModalOpen] = useState<boolean>(false);
  const [exerciseSearch, setExerciseSearch] = useState<string>('');

  // Confirmation modals
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState<boolean>(false);
  const [isFinishing, setIsFinishing] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Live session elapsed timer
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  useEffect(() => {
    if (!activeWorkout) return;
    const startMs = new Date(activeWorkout.startedAt).getTime();

    const updateTimer = () => {
      const now = Date.now();
      setElapsedSeconds(Math.max(0, Math.floor((now - startMs) / 1000)));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeWorkout]);

  if (!activeWorkout) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
          No Active Workout
        </h2>
        <p className="text-xs text-neutral-500 mb-6">
          Start a routine from the Today screen or select an existing split.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold uppercase tracking-wider"
        >
          Go to Today
        </button>
      </div>
    );
  }

  const formatElapsedTime = (sec: number): string => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    if (hrs > 0) {
      return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Trigger set completion and auto-start rest timer
  const handleToggleComplete = (exerciseId: string, set: WorkoutSet) => {
    setValidationError(null);

    // If currently false and user marks complete: validate weight & reps
    if (!set.isCompleted) {
      if (set.weight < 0 || set.reps <= 0) {
        setValidationError(`Please enter valid reps and weight for ${set.exerciseName}.`);
        return;
      }
      updateActiveSet(exerciseId, set.id, { isCompleted: true });

      // Auto-start rest timer
      setRestTimerSeconds(defaultRest);
      setIsRestTimerOpen(true);
    } else {
      // Toggle back to incomplete
      updateActiveSet(exerciseId, set.id, { isCompleted: false });
    }
  };

  const handleFinish = async () => {
    setValidationError(null);

    // Verify at least one set is completed
    const hasAnyCompleted = activeWorkout.exercises.some((group) =>
      group.sets.some((s) => s.isCompleted || (s.weight > 0 && s.reps > 0))
    );

    if (!hasAnyCompleted) {
      setValidationError('Please log at least one set before finishing the workout.');
      return;
    }

    try {
      setIsFinishing(true);
      const prs = await finishWorkout();
      setIsFinishing(false);

      if (prs.length === 0) {
        navigate('/history');
      }
      // If PRs detected, PRCelebrationModal will display due to latestPRs state in WorkoutContext
    } catch (err) {
      console.error('Failed to finish workout:', err);
      setIsFinishing(false);
    }
  };

  const filteredExercisesToAdd = exercises.filter(
    (ex) =>
      !activeWorkout.exercises.some((g) => g.exercise.id === ex.id) &&
      ex.name.toLowerCase().includes(exerciseSearch.toLowerCase())
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 pb-32">
      {/* Sticky top header with elapsed time and Finish */}
      <div className="sticky top-14 z-30 bg-[#fafafa]/95 dark:bg-[#0a0a0a]/95 backdrop-blur-md py-3 -mx-4 px-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between mb-4">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-400 block">
            {activeWorkout.splitName ? `${activeWorkout.splitName} • ` : ''}Active
          </span>
          <h1 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-100 leading-tight">
            {activeWorkout.dayName}
          </h1>
        </div>

        <div className="flex items-center space-x-3">
          {/* Monospace live stopwatch */}
          <div className="flex items-center space-x-1.5 font-numeric text-sm font-semibold text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800/80 px-2.5 py-1 rounded-md">
            <Clock className="w-3.5 h-3.5 text-neutral-400" />
            <span>{formatElapsedTime(elapsedSeconds)}</span>
          </div>

          <button
            onClick={handleFinish}
            disabled={isFinishing}
            className="px-3.5 py-1.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold uppercase tracking-wide hover:opacity-90 transition-opacity cursor-pointer"
          >
            {isFinishing ? 'Saving...' : 'Finish'}
          </button>
        </div>
      </div>

      {validationError && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
          <button onClick={() => setValidationError(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Exercises Section */}
      <div className="space-y-6">
        {activeWorkout.exercises.map((group, exIndex) => {
          const lastTimeSets = getLastPerformance(group.exercise.id);

          return (
            <div
              key={group.exercise.id}
              className="bg-white dark:bg-[#121212] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 shadow-xs"
            >
              {/* Exercise Header */}
              <div className="flex items-start justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800/80 mb-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-numeric text-xs font-semibold text-neutral-400">
                      {String(exIndex + 1).padStart(2, '0')}
                    </span>
                    <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                      {group.exercise.name}
                    </h2>
                  </div>
                  <span className="text-[10px] font-mono uppercase text-neutral-400 ml-6">
                    {group.exercise.category}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  {/* "Last time" Chip */}
                  {lastTimeSets && lastTimeSets.length > 0 && (
                    <button
                      onClick={() =>
                        setLastTimeModalExercise({
                          name: group.exercise.name,
                          sets: lastTimeSets,
                        })
                      }
                      title="View previous session sets"
                      className="flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-mono bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 hover:border-neutral-400 transition-colors border border-transparent"
                    >
                      <History className="w-3 h-3 text-neutral-400" />
                      <span>Last: {formatWeight(lastTimeSets[0].weight, unit)} × {lastTimeSets[0].reps}</span>
                    </button>
                  )}

                  <button
                    onClick={() => removeExerciseFromActiveWorkout(group.exercise.id)}
                    title="Remove exercise from workout"
                    className="p-1 rounded text-neutral-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Set Table Column Headers */}
              <div className="grid grid-cols-12 gap-1.5 text-[10px] font-mono uppercase tracking-wider text-neutral-400 px-1 mb-2">
                <div className="col-span-2 text-center">Set</div>
                <div className="col-span-3 text-center">{unit.toUpperCase()}</div>
                <div className="col-span-3 text-center">Reps</div>
                <div className="col-span-2 text-center">RPE</div>
                <div className="col-span-2 text-center">Done</div>
              </div>

              {/* Sets List */}
              <div className="space-y-2">
                {group.sets.map((set, sIndex) => {
                  const displayWeight = set.weight === 0 ? '' : toDisplayWeight(set.weight, unit);

                  return (
                    <div
                      key={set.id}
                      className={`grid grid-cols-12 gap-1.5 items-center p-1.5 rounded-xl border transition-all ${
                        set.isCompleted
                          ? 'bg-neutral-50 dark:bg-neutral-900/60 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100'
                          : 'bg-white dark:bg-[#121212] border-neutral-200 dark:border-neutral-800'
                      } ${set.isWarmup ? 'opacity-70 border-dashed' : ''}`}
                    >
                      {/* Set Number & Warmup Toggle */}
                      <div className="col-span-2 flex items-center justify-center space-x-1">
                        <span className="font-numeric font-semibold text-xs text-neutral-500">
                          {sIndex + 1}
                        </span>
                        {/* Dedicated Warmup Toggle Control */}
                        <button
                          type="button"
                          onClick={() =>
                            updateActiveSet(group.exercise.id, set.id, {
                              isWarmup: !set.isWarmup,
                            })
                          }
                          title={set.isWarmup ? 'Warmup set (excluded from PRs & volume)' : 'Mark as warmup set'}
                          className={`w-5 h-5 rounded text-[10px] font-mono font-bold flex items-center justify-center transition-colors cursor-pointer ${
                            set.isWarmup
                              ? 'bg-amber-500 text-white dark:bg-amber-600'
                              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                          }`}
                        >
                          W
                        </button>
                      </div>

                      {/* Weight Input (Blank by default, no unwanted auto-fill) */}
                      <div className="col-span-3">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          placeholder="—"
                          value={displayWeight}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : parseFloat(e.target.value);
                            const canonicalLbs = toStorageWeight(val, unit);
                            updateActiveSet(group.exercise.id, set.id, {
                              weight: canonicalLbs,
                            });
                          }}
                          className="w-full text-center py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-transparent focus:border-neutral-400 text-sm font-numeric font-bold focus:outline-none transition-colors"
                        />
                      </div>

                      {/* Reps Input */}
                      <div className="col-span-3">
                        <input
                          type="number"
                          step="1"
                          min="0"
                          placeholder="—"
                          value={set.reps === 0 ? '' : set.reps}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                            updateActiveSet(group.exercise.id, set.id, {
                              reps: val,
                            });
                          }}
                          className="w-full text-center py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-transparent focus:border-neutral-400 text-sm font-numeric font-bold focus:outline-none transition-colors"
                        />
                      </div>

                      {/* RPE Selector */}
                      <div className="col-span-2">
                        <select
                          value={set.rpe || 8}
                          onChange={(e) => {
                            updateActiveSet(group.exercise.id, set.id, {
                              rpe: parseFloat(e.target.value),
                            });
                          }}
                          className="w-full text-center py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-transparent text-xs font-numeric font-medium focus:outline-none"
                        >
                          {[6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10].map((r) => (
                            <option key={r} value={r}>
                              @{r}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Complete Checkbox & Delete */}
                      <div className="col-span-2 flex items-center justify-center space-x-1">
                        <button
                          type="button"
                          onClick={() => handleToggleComplete(group.exercise.id, set)}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                            set.isCompleted
                              ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
                          }`}
                        >
                          <Check className="w-4 h-4 stroke-[2.5]" />
                        </button>

                        {group.sets.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeActiveSet(group.exercise.id, set.id)}
                            className="p-1 text-neutral-300 hover:text-neutral-500 dark:hover:text-neutral-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add Set Button */}
              <div className="mt-3 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => addSetToActive(group.exercise.id, false)}
                  className="flex-1 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center justify-center space-x-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Set</span>
                </button>

                <button
                  type="button"
                  onClick={() => addSetToActive(group.exercise.id, true)}
                  title="Add Warmup Set"
                  className="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 text-xs font-mono text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 flex items-center space-x-1 transition-colors"
                >
                  <span className="font-bold text-amber-500">W</span>
                  <span>Warmup</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Exercise to Workout Button */}
      <div className="mt-6 flex flex-col items-center space-y-4">
        <button
          type="button"
          onClick={() => setIsAddExerciseModalOpen(true)}
          className="w-full py-3 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700 hover:border-neutral-900 dark:hover:border-neutral-100 text-xs font-semibold text-neutral-800 dark:text-neutral-200 flex items-center justify-center space-x-2 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Exercise to Session</span>
        </button>

        {/* Discard Workout */}
        <button
          type="button"
          onClick={() => setIsDiscardConfirmOpen(true)}
          className="text-xs font-mono text-neutral-400 hover:text-red-500 transition-colors"
        >
          Discard Workout
        </button>
      </div>

      {/* Rest Timer Floating Bar */}
      <RestTimerBar
        isOpen={isRestTimerOpen}
        initialSeconds={restTimerSeconds}
        onClose={() => setIsRestTimerOpen(false)}
      />

      {/* PR Celebration Modal */}
      <PRCelebrationModal
        prs={latestPRs}
        onClose={() => {
          clearLatestPRs();
          navigate('/history');
        }}
      />

      {/* "Last Time" Popover Sheet */}
      {lastTimeModalExercise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-[#121212] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800 mb-3">
              <div>
                <span className="text-[10px] uppercase font-mono text-neutral-400">Previous Session</span>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  {lastTimeModalExercise.name}
                </h3>
              </div>
              <button
                onClick={() => setLastTimeModalExercise(null)}
                className="p-1 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 mb-4">
              {lastTimeModalExercise.sets.map((s, idx) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-neutral-50 dark:bg-neutral-900 font-mono text-xs"
                >
                  <span className="text-neutral-400">Set {idx + 1}</span>
                  <span className="font-numeric font-bold text-neutral-900 dark:text-neutral-100">
                    {formatWeight(s.weight, unit)} × {s.reps} reps
                  </span>
                  {s.rpe && <span className="text-neutral-400">@{s.rpe}</span>}
                </div>
              ))}
            </div>

            <button
              onClick={() => setLastTimeModalExercise(null)}
              className="w-full py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs font-semibold text-neutral-900 dark:text-neutral-100"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Add Exercise Modal */}
      {isAddExerciseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#121212] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800 mb-3">
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                Add Exercise
              </h3>
              <button
                onClick={() => setIsAddExerciseModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search */}
            <div className="relative mb-3">
              <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
              <input
                type="text"
                value={exerciseSearch}
                onChange={(e) => setExerciseSearch(e.target.value)}
                placeholder="Search exercise..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs focus:outline-none focus:border-neutral-400"
              />
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1 space-y-1.5 pr-1">
              {filteredExercisesToAdd.length > 0 ? (
                filteredExercisesToAdd.map((ex) => (
                  <button
                    key={ex.id}
                    onClick={() => {
                      addExerciseToActiveWorkout(ex);
                      setIsAddExerciseModalOpen(false);
                      setExerciseSearch('');
                    }}
                    className="w-full text-left p-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-between transition-colors"
                  >
                    <div>
                      <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                        {ex.name}
                      </div>
                      <div className="text-[10px] font-mono uppercase text-neutral-400">
                        {ex.category}
                      </div>
                    </div>
                    <Plus className="w-4 h-4 text-neutral-400" />
                  </button>
                ))
              ) : (
                <p className="text-xs text-neutral-400 text-center py-6 font-mono">
                  No matching exercises found
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Discard Confirmation Modal */}
      {isDiscardConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-xs bg-white dark:bg-[#121212] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 text-center shadow-xl">
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mb-2">
              Discard Workout?
            </h3>
            <p className="text-xs text-neutral-500 mb-5">
              All logged sets in this active session will be permanently cleared.
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => setIsDiscardConfirmOpen(false)}
                className="flex-1 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  discardWorkout();
                  setIsDiscardConfirmOpen(false);
                  navigate('/');
                }}
                className="flex-1 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
