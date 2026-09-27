import React, { useState } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { useAuth } from '../context/AuthContext';
import { WorkoutSession, WorkoutSet } from '../types';
import {
  Calendar,
  Clock,
  Trophy,
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  X,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { formatWeight, toDisplayWeight, toStorageWeight } from '../lib/units';

export const HistoryPage: React.FC = () => {
  const { sessions, updatePastSet, deletePastSet, deletePastSession } = useWorkout();
  const { profile } = useAuth();
  const unit = profile?.weightUnit || 'lbs';

  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  // Edit Set Modal
  const [editingSetInfo, setEditingSetInfo] = useState<{
    sessionId: string;
    set: WorkoutSet;
  } | null>(null);
  const [editWeightInput, setEditWeightInput] = useState<string>('');
  const [editRepsInput, setEditRepsInput] = useState<string>('');
  const [editRpeInput, setEditRpeInput] = useState<number>(8);
  const [editIsWarmup, setEditIsWarmup] = useState<boolean>(false);

  // Delete Session Confirmation
  const [sessionToDelete, setSessionToDelete] = useState<WorkoutSession | null>(null);

  const toggleExpand = (sessionId: string) => {
    setExpandedSessionId(expandedSessionId === sessionId ? null : sessionId);
  };

  const handleOpenEditSet = (sessionId: string, set: WorkoutSet) => {
    setEditingSetInfo({ sessionId, set });
    setEditWeightInput(String(toDisplayWeight(set.weight, unit)));
    setEditRepsInput(String(set.reps));
    setEditRpeInput(set.rpe || 8);
    setEditIsWarmup(set.isWarmup);
  };

  const handleSaveEditSet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSetInfo) return;

    const parsedWeight = parseFloat(editWeightInput) || 0;
    const parsedReps = parseInt(editRepsInput, 10) || 0;

    const updatedSet: WorkoutSet = {
      ...editingSetInfo.set,
      weight: toStorageWeight(parsedWeight, unit),
      reps: parsedReps,
      rpe: editRpeInput,
      isWarmup: editIsWarmup,
    };

    try {
      await updatePastSet(editingSetInfo.sessionId, updatedSet);
      setEditingSetInfo(null);
    } catch (err) {
      console.error('Failed to update set:', err);
    }
  };

  const handleDeleteSet = async (sessionId: string, setId: string) => {
    if (!window.confirm('Are you sure you want to remove this set?')) return;
    try {
      await deletePastSet(sessionId, setId);
    } catch (err) {
      console.error('Failed to delete set:', err);
    }
  };

  const handleDeleteSession = async () => {
    if (!sessionToDelete) return;
    try {
      await deletePastSession(sessionToDelete.id);
      setSessionToDelete(null);
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 font-sans">
            History
          </h1>
          <p className="text-xs text-neutral-500 font-mono mt-0.5">
            {sessions.length} logged workout {sessions.length === 1 ? 'session' : 'sessions'}
          </p>
        </div>
      </div>

      {/* Sessions List */}
      <div className="space-y-4">
        {sessions.map((session) => {
          const isExpanded = expandedSessionId === session.id;
          const sessionDate = new Date(session.startedAt);
          const durationMins = Math.round(session.durationSeconds / 60);

          // Group sets by exercise
          const exerciseGroups: { [exId: string]: { name: string; sets: WorkoutSet[] } } = {};
          (session.sets || []).forEach((set) => {
            if (!exerciseGroups[set.exerciseId]) {
              exerciseGroups[set.exerciseId] = {
                name: set.exerciseName || 'Exercise removed',
                sets: [],
              };
            }
            exerciseGroups[set.exerciseId].sets.push(set);
          });

          return (
            <div
              key={session.id}
              className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#121212] overflow-hidden transition-all shadow-xs"
            >
              {/* Session Summary Card */}
              <div
                onClick={() => toggleExpand(session.id)}
                className="p-4 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900/40 transition-colors flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center space-x-2 text-[11px] font-mono text-neutral-400">
                    <span>
                      {sessionDate.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    <span>•</span>
                    <span>{durationMins > 0 ? `${durationMins}m` : '1m'}</span>
                  </div>

                  <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mt-0.5">
                    {session.dayName || 'Workout'}
                  </h2>

                  <div className="flex items-center space-x-3 text-xs font-mono text-neutral-500 mt-1">
                    <span>{session.totalSets} sets</span>
                    <span>•</span>
                    <span className="font-numeric font-medium">
                      {formatWeight(session.totalVolume, unit)} vol
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {session.prsAchieved && session.prsAchieved.length > 0 && (
                    <div className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-[#e8321c]/10 text-[#e8321c] border border-[#e8321c]/30 text-xs font-mono font-medium">
                      <Trophy className="w-3.5 h-3.5" />
                      <span>{session.prsAchieved.length} PR</span>
                    </div>
                  )}

                  <div className="text-neutral-400">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {/* Expanded Set Details */}
              {isExpanded && (
                <div className="border-t border-neutral-100 dark:border-neutral-800/80 p-4 bg-neutral-50/50 dark:bg-neutral-900/30 space-y-4">
                  {Object.entries(exerciseGroups).map(([exId, group]) => (
                    <div key={exId} className="space-y-1.5">
                      <h4 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                        {group.name}
                      </h4>

                      <div className="space-y-1">
                        {group.sets.map((set, sIdx) => (
                          <div
                            key={set.id}
                            className={`flex items-center justify-between p-2 rounded-lg bg-white dark:bg-neutral-900 border text-xs font-mono ${
                              set.isWarmup
                                ? 'border-dashed border-neutral-300 dark:border-neutral-700 opacity-70'
                                : 'border-neutral-200 dark:border-neutral-800'
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <span className="text-neutral-400 w-4">{sIdx + 1}</span>
                              {set.isWarmup && (
                                <span className="text-[9px] px-1 rounded bg-amber-500/10 text-amber-500 font-bold">
                                  W
                                </span>
                              )}
                              <span className="font-numeric font-bold text-neutral-900 dark:text-neutral-100">
                                {formatWeight(set.weight, unit)} × {set.reps} reps
                              </span>
                              {set.rpe && <span className="text-neutral-400">@{set.rpe}</span>}
                              {set.isPR && (
                                <span className="text-[9px] px-1 rounded bg-[#e8321c]/10 text-[#e8321c] font-bold">
                                  PR
                                </span>
                              )}
                            </div>

                            {/* Set Actions */}
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => handleOpenEditSet(session.id, set)}
                                title="Edit Set"
                                className="p-1 rounded text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteSet(session.id, set.id)}
                                title="Delete Set"
                                className="p-1 rounded text-neutral-400 hover:text-red-500"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Delete Session Button */}
                  <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex justify-end">
                    <button
                      onClick={() => setSessionToDelete(session)}
                      className="text-xs font-mono text-red-500 hover:text-red-700 flex items-center space-x-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Entire Session</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {sessions.length === 0 && (
          <div className="p-8 text-center border border-dashed border-neutral-300 dark:border-neutral-700 rounded-2xl">
            <Clock className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
              No workouts logged yet
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              Start your first session on the Today tab to record your training history.
            </p>
          </div>
        )}
      </div>

      {/* EDIT SET MODAL */}
      {editingSetInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-[#121212] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800 mb-3">
              <div>
                <span className="text-[10px] uppercase font-mono text-neutral-400">Edit Past Set</span>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                  {editingSetInfo.set.exerciseName}
                </h3>
              </div>
              <button
                onClick={() => setEditingSetInfo(null)}
                className="p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditSet} className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">
                  Weight ({unit.toUpperCase()})
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={editWeightInput}
                  onChange={(e) => setEditWeightInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-numeric font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">
                  Reps
                </label>
                <input
                  type="number"
                  step="1"
                  required
                  value={editRepsInput}
                  onChange={(e) => setEditRepsInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-numeric font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">
                  RPE
                </label>
                <select
                  value={editRpeInput}
                  onChange={(e) => setEditRpeInput(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-numeric focus:outline-none"
                >
                  {[6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10].map((r) => (
                    <option key={r} value={r}>
                      @{r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="isWarmupCheck"
                  checked={editIsWarmup}
                  onChange={(e) => setEditIsWarmup(e.target.checked)}
                  className="w-4 h-4 rounded text-neutral-900 focus:ring-0"
                />
                <label htmlFor="isWarmupCheck" className="text-xs text-neutral-700 dark:text-neutral-300">
                  Mark as Warmup Set (excludes from PRs and volume)
                </label>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingSetInfo(null)}
                  className="px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold uppercase tracking-wider"
                >
                  Save & Recalibrate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE SESSION MODAL */}
      {sessionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-xs bg-white dark:bg-[#121212] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 text-center shadow-xl">
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mb-2">
              Delete Workout Session?
            </h3>
            <p className="text-xs text-neutral-500 mb-5">
              This session and its logged sets will be deleted. Any PRs earned during this workout will be automatically recalibrated.
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => setSessionToDelete(null)}
                className="flex-1 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSession}
                className="flex-1 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
