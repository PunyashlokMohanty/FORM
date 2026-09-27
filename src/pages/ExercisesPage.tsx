import React, { useState } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { useAuth } from '../context/AuthContext';
import { Exercise, ExerciseCategory } from '../types';
import {
  Search,
  Plus,
  Dumbbell,
  Trophy,
  X,
  History,
  TrendingUp,
  Trash2,
} from 'lucide-react';
import { formatWeight } from '../lib/units';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export const ExercisesPage: React.FC = () => {
  const { exercises, createExercise, deleteExercise, sessions } = useWorkout();
  const { profile } = useAuth();
  const unit = profile?.weightUnit || 'lbs';

  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [selectedExerciseForDetail, setSelectedExerciseForDetail] = useState<Exercise | null>(null);

  // New exercise form
  const [newName, setNewName] = useState<string>('');
  const [newCategory, setNewCategory] = useState<ExerciseCategory>('barbell');
  const [newNotes, setNewNotes] = useState<string>('');

  const categories: { label: string; value: string }[] = [
    { label: 'All', value: 'all' },
    { label: 'Barbell', value: 'barbell' },
    { label: 'Dumbbell', value: 'dumbbell' },
    { label: 'Machine', value: 'machine' },
    { label: 'Cable', value: 'cable' },
    { label: 'Bodyweight', value: 'bodyweight' },
    { label: 'Cardio', value: 'cardio' },
  ];

  const filteredExercises = exercises.filter((ex) => {
    const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || ex.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCreateExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await createExercise(newName.trim(), newCategory, newNotes.trim());
      setIsCreateModalOpen(false);
      setNewName('');
      setNewNotes('');
    } catch (err) {
      console.error('Failed to create exercise:', err);
    }
  };

  // Compute historical performance data for the selected exercise detail modal
  const exerciseHistoryData = selectedExerciseForDetail
    ? sessions
        .slice()
        .reverse()
        .map((s) => {
          const sets = (s.sets || []).filter(
            (set) => set.exerciseId === selectedExerciseForDetail.id && set.isCompleted && !set.isWarmup
          );
          if (sets.length === 0) return null;
          const maxWeight = Math.max(...sets.map((set) => set.weight));
          const max1RM = Math.max(...sets.map((set) => (set.weight * (1 + set.reps / 30))));
          return {
            date: new Date(s.startedAt).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
            weight: maxWeight,
            estimated1RM: Math.round(max1RM * 10) / 10,
            setsCount: sets.length,
          };
        })
        .filter((d): d is NonNullable<typeof d> => Boolean(d))
    : [];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 font-sans">
            Exercises
          </h1>
          <p className="text-xs text-neutral-500 font-mono mt-0.5">
            {exercises.length} movements in your library
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="py-2 px-3.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold uppercase tracking-wider flex items-center space-x-1.5 hover:opacity-90 transition-opacity cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-3">
        <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search movements..."
          className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs focus:outline-none focus:border-neutral-400 dark:text-neutral-100"
        />
      </div>

      {/* Category Pills */}
      <div className="flex space-x-1.5 overflow-x-auto pb-3 mb-4 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setSelectedCategory(cat.value)}
            className={`px-3 py-1 rounded-full text-xs font-mono transition-colors shrink-0 cursor-pointer ${
              selectedCategory === cat.value
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Exercises List */}
      <div className="space-y-2.5">
        {filteredExercises.map((ex) => {
          const bestWeight = ex.personalBests?.bestWeight?.value;
          const best1RM = ex.personalBests?.bestEstimated1RM?.value;

          return (
            <div
              key={ex.id}
              onClick={() => setSelectedExerciseForDetail(ex)}
              className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#121212] hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors flex items-center justify-between cursor-pointer"
            >
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                    {ex.name}
                  </h3>
                  {ex.isCustom && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500 uppercase">
                      Custom
                    </span>
                  )}
                </div>
                <div className="text-[10px] font-mono uppercase text-neutral-400 mt-0.5">
                  {ex.category}
                </div>
              </div>

              {/* Running Personal Best Display */}
              <div className="text-right font-numeric">
                {bestWeight && bestWeight > 0 ? (
                  <div>
                    <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                      {formatWeight(bestWeight, unit)}
                    </div>
                    {best1RM && best1RM > 0 && (
                      <div className="text-[10px] font-mono text-neutral-400">
                        1RM: {formatWeight(best1RM, unit)}
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-[10px] font-mono text-neutral-400">—</span>
                )}
              </div>
            </div>
          );
        })}

        {filteredExercises.length === 0 && (
          <div className="p-8 text-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl">
            <p className="text-xs font-mono text-neutral-400">No exercises match criteria</p>
          </div>
        )}
      </div>

      {/* CREATE EXERCISE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-[#121212] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800 mb-3">
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                New Custom Exercise
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateExercise} className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">
                  Exercise Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bulgarian Split Squat"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as ExerciseCategory)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs focus:outline-none"
                >
                  <option value="barbell">Barbell</option>
                  <option value="dumbbell">Dumbbell</option>
                  <option value="machine">Machine</option>
                  <option value="cable">Cable</option>
                  <option value="bodyweight">Bodyweight</option>
                  <option value="cardio">Cardio</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">
                  Notes (optional)
                </label>
                <input
                  type="text"
                  placeholder="Grip width, seat adjustment, cue..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-2.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold uppercase tracking-wider"
              >
                Add Exercise
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EXERCISE DETAIL & PROGRESS MODAL */}
      {selectedExerciseForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#121212] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-2xl max-h-[85vh] flex flex-col">
            {/* Modal header */}
            <div className="flex items-start justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800 mb-3">
              <div>
                <div className="text-[10px] font-mono uppercase text-neutral-400">
                  {selectedExerciseForDetail.category}
                </div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                  {selectedExerciseForDetail.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedExerciseForDetail(null)}
                className="p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-4 pr-1">
              {/* Personal Bests Cards */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                  <span className="text-[10px] uppercase font-mono text-neutral-400 block">Heaviest Weight</span>
                  <span className="text-base font-numeric font-bold text-neutral-900 dark:text-neutral-100">
                    {selectedExerciseForDetail.personalBests?.bestWeight?.value
                      ? formatWeight(selectedExerciseForDetail.personalBests.bestWeight.value, unit)
                      : '—'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                  <span className="text-[10px] uppercase font-mono text-neutral-400 block">Est. 1RM Max</span>
                  <span className="text-base font-numeric font-bold text-[#e8321c]">
                    {selectedExerciseForDetail.personalBests?.bestEstimated1RM?.value
                      ? formatWeight(selectedExerciseForDetail.personalBests.bestEstimated1RM.value, unit)
                      : '—'}
                  </span>
                </div>
              </div>

              {/* Progression Chart */}
              {exerciseHistoryData.length > 1 ? (
                <div className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
                  <span className="text-[10px] uppercase font-mono text-neutral-400 block mb-2">
                    Weight Progression Over Time
                  </span>
                  <div className="h-36 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={exerciseHistoryData}>
                        <XAxis dataKey="date" stroke="#888888" fontSize={10} tickLine={false} />
                        <YAxis stroke="#888888" fontSize={10} tickLine={false} domain={['auto', 'auto']} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#171717',
                            borderColor: '#333',
                            fontSize: '11px',
                            color: '#fff',
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="weight"
                          stroke="#e8321c"
                          strokeWidth={2}
                          dot={{ r: 3, fill: '#e8321c' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800 text-center">
                  <p className="text-xs font-mono text-neutral-400">
                    Log at least 2 sessions to render progression trends
                  </p>
                </div>
              )}

              {/* Historical Logs List */}
              <div>
                <span className="text-[10px] uppercase font-mono text-neutral-400 block mb-2">
                  Session History
                </span>
                <div className="space-y-1.5">
                  {sessions
                    .filter((s) => (s.sets || []).some((set) => set.exerciseId === selectedExerciseForDetail.id))
                    .map((s) => {
                      const sets = (s.sets || []).filter(
                        (set) => set.exerciseId === selectedExerciseForDetail.id && set.isCompleted
                      );
                      return (
                        <div
                          key={s.id}
                          className="p-2.5 rounded-lg border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900 flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-medium text-neutral-900 dark:text-neutral-100">
                              {new Date(s.startedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </div>
                            <div className="text-[10px] font-mono text-neutral-400">
                              {s.dayName}
                            </div>
                          </div>

                          <div className="text-right font-mono text-[11px] text-neutral-600 dark:text-neutral-300">
                            {sets.map((set, idx) => (
                              <span key={set.id}>
                                {formatWeight(set.weight, unit)}×{set.reps}
                                {idx < sets.length - 1 ? ', ' : ''}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Custom delete button if custom exercise */}
            {selectedExerciseForDetail.isCustom && (
              <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
                <button
                  type="button"
                  onClick={async () => {
                    await deleteExercise(selectedExerciseForDetail.id);
                    setSelectedExerciseForDetail(null);
                  }}
                  className="text-xs text-red-500 hover:text-red-700 font-mono flex items-center space-x-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Exercise</span>
                </button>

                <button
                  onClick={() => setSelectedExerciseForDetail(null)}
                  className="px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
