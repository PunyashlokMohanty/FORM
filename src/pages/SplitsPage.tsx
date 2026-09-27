import React, { useState } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { Split, SplitDay, Exercise } from '../types';
import {
  Layers,
  Plus,
  Check,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronUp,
  X,
  Search,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { SPLIT_TEMPLATES } from '../lib/constants';

export const SplitsPage: React.FC = () => {
  const {
    splits,
    activeSplit,
    exercises,
    createSplit,
    updateSplit,
    deleteSplit,
    setActiveSplit,
    createSplitFromTemplate,
  } = useWorkout();

  // Create Split Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [createMode, setCreateMode] = useState<'template' | 'custom'>('template');
  const [newSplitName, setNewSplitName] = useState<string>('');
  const [customDays, setCustomDays] = useState<{ name: string; exerciseIds: string[] }[]>([
    { name: 'Day 1', exerciseIds: [] },
  ]);

  // Edit Split Days / Exercises Modal
  const [editingSplit, setEditingSplit] = useState<Split | null>(null);
  const [editingDays, setEditingDays] = useState<SplitDay[]>([]);
  const [selectedDayIdForAssign, setSelectedDayIdForAssign] = useState<string | null>(null);
  const [exerciseSearch, setExerciseSearch] = useState<string>('');

  // Delete confirmation
  const [splitToDelete, setSplitToDelete] = useState<Split | null>(null);

  const handleOpenEdit = (split: Split) => {
    setEditingSplit(split);
    setEditingDays([...split.days].sort((a, b) => a.order - b.order));
  };

  const handleSaveEdit = async () => {
    if (!editingSplit) return;
    try {
      await updateSplit(editingSplit.id, {
        name: editingSplit.name,
        days: editingDays,
      });
      setEditingSplit(null);
    } catch (err) {
      console.error('Failed to update split:', err);
    }
  };

  const handleAddDayToEdit = () => {
    const newDay: SplitDay = {
      id: `day_${Date.now()}`,
      name: `Day ${editingDays.length + 1}`,
      order: editingDays.length,
      exerciseIds: [],
    };
    setEditingDays([...editingDays, newDay]);
  };

  const handleMoveDay = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= editingDays.length) return;

    const updated = [...editingDays];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    // re-index order
    setEditingDays(updated.map((d, i) => ({ ...d, order: i })));
  };

  const handleRemoveDay = (dayId: string) => {
    setEditingDays(editingDays.filter((d) => d.id !== dayId).map((d, i) => ({ ...d, order: i })));
  };

  const handleToggleExerciseInDay = (dayId: string, exerciseId: string) => {
    setEditingDays((prev) =>
      prev.map((day) => {
        if (day.id !== dayId) return day;
        const exists = day.exerciseIds.includes(exerciseId);
        const newIds = exists
          ? day.exerciseIds.filter((id) => id !== exerciseId)
          : [...day.exerciseIds, exerciseId];
        return { ...day, exerciseIds: newIds };
      })
    );
  };

  const handleCreateCustomSplit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSplitName.trim()) return;

    try {
      await createSplit(
        newSplitName.trim(),
        customDays.map((d, i) => ({ ...d, order: i }))
      );
      setIsCreateModalOpen(false);
      setNewSplitName('');
      setCustomDays([{ name: 'Day 1', exerciseIds: [] }]);
    } catch (err) {
      console.error('Failed to create split:', err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 font-sans">
            Splits
          </h1>
          <p className="text-xs text-neutral-500 font-mono mt-0.5">
            Manage your workout routines & schedules
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="py-2 px-3.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold uppercase tracking-wider flex items-center space-x-1.5 hover:opacity-90 transition-opacity cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Split</span>
        </button>
      </div>

      {/* Splits List */}
      <div className="space-y-4">
        {splits.map((split) => {
          const isActive = activeSplit?.id === split.id;

          return (
            <div
              key={split.id}
              className={`rounded-2xl border transition-all p-5 ${
                isActive
                  ? 'bg-white dark:bg-[#121212] border-neutral-400 dark:border-neutral-600 shadow-xs'
                  : 'bg-white dark:bg-[#121212] border-neutral-200 dark:border-neutral-800'
              }`}
            >
              {/* Card top */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                      {split.name}
                    </h2>
                    {isActive ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold">
                        Active
                      </span>
                    ) : (
                      <button
                        onClick={() => setActiveSplit(split.id)}
                        className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase border border-neutral-300 dark:border-neutral-700 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
                      >
                        Set Active
                      </button>
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-neutral-400">
                    {split.days.length} training {split.days.length === 1 ? 'day' : 'days'}
                  </span>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleOpenEdit(split)}
                    className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                    title="Edit Split"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setSplitToDelete(split)}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    title="Delete Split"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Days preview */}
              <div className="space-y-2 mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800/80">
                {split.days.map((day, idx) => (
                  <div
                    key={day.id}
                    className="flex items-center justify-between text-xs py-1 text-neutral-700 dark:text-neutral-300"
                  >
                    <span className="font-medium">
                      {idx + 1}. {day.name}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-400">
                      {day.exerciseIds.length} exercises
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {splits.length === 0 && (
          <div className="p-8 text-center border border-dashed border-neutral-300 dark:border-neutral-700 rounded-2xl">
            <Layers className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
              No splits created yet
            </p>
            <p className="text-xs text-neutral-500 mt-1 mb-4">
              Create a custom routine or pick one of our proven split templates.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="py-2 px-4 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold uppercase"
            >
              Get Started
            </button>
          </div>
        )}
      </div>

      {/* CREATE SPLIT MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#121212] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800 mb-4">
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                New Workout Split
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode switch */}
            <div className="flex rounded-xl bg-neutral-100 dark:bg-neutral-800 p-1 mb-4">
              <button
                type="button"
                onClick={() => setCreateMode('template')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  createMode === 'template'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
                }`}
              >
                From Template
              </button>
              <button
                type="button"
                onClick={() => setCreateMode('custom')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  createMode === 'custom'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
                }`}
              >
                Custom Split
              </button>
            </div>

            {createMode === 'template' ? (
              <div className="space-y-3">
                {SPLIT_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.name}
                    onClick={async () => {
                      await createSplitFromTemplate(tmpl.name);
                      setIsCreateModalOpen(false);
                    }}
                    className="w-full text-left p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-neutral-900 dark:hover:border-neutral-100 transition-colors"
                  >
                    <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                      {tmpl.name}
                    </div>
                    <div className="text-[11px] text-neutral-500 mt-0.5">{tmpl.description}</div>
                  </button>
                ))}
              </div>
            ) : (
              <form onSubmit={handleCreateCustomSplit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">
                    Split Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Upper / Lower Hypertrophy"
                    value={newSplitName}
                    onChange={(e) => setNewSplitName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs focus:outline-none focus:border-neutral-400"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-mono uppercase text-neutral-400">
                      Training Days
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setCustomDays([...customDays, { name: `Day ${customDays.length + 1}`, exerciseIds: [] }])
                      }
                      className="text-xs text-neutral-600 dark:text-neutral-300 font-semibold flex items-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Day</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    {customDays.map((cd, idx) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={cd.name}
                          onChange={(e) => {
                            const updated = [...customDays];
                            updated[idx].name = e.target.value;
                            setCustomDays(updated);
                          }}
                          className="flex-1 px-3 py-1.5 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs"
                        />
                        {customDays.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setCustomDays(customDays.filter((_, i) => i !== idx))}
                            className="p-1.5 text-neutral-400 hover:text-red-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold uppercase tracking-wider"
                >
                  Create Split
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* EDIT SPLIT MODAL */}
      {editingSplit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-[#121212] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800 mb-4">
              <div>
                <span className="text-[10px] uppercase font-mono text-neutral-400">Edit Program</span>
                <input
                  type="text"
                  value={editingSplit.name}
                  onChange={(e) => setEditingSplit({ ...editingSplit, name: e.target.value })}
                  className="text-base font-bold bg-transparent border-b border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-neutral-900 dark:focus:border-neutral-100 block"
                />
              </div>
              <button
                onClick={() => setEditingSplit(null)}
                className="p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Days list */}
            <div className="overflow-y-auto flex-1 space-y-4 pr-1">
              {editingDays.map((day, dIdx) => (
                <div
                  key={day.id}
                  className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <input
                      type="text"
                      value={day.name}
                      onChange={(e) => {
                        const updated = [...editingDays];
                        updated[dIdx].name = e.target.value;
                        setEditingDays(updated);
                      }}
                      className="text-xs font-bold text-neutral-900 dark:text-neutral-100 bg-transparent border-b border-transparent hover:border-neutral-300 focus:border-neutral-400 focus:outline-none"
                    />

                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        disabled={dIdx === 0}
                        onClick={() => handleMoveDay(dIdx, 'up')}
                        className="p-1 rounded text-neutral-400 hover:text-neutral-900 disabled:opacity-30"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={dIdx === editingDays.length - 1}
                        onClick={() => handleMoveDay(dIdx, 'down')}
                        className="p-1 rounded text-neutral-400 hover:text-neutral-900 disabled:opacity-30"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveDay(day.id)}
                        className="p-1 rounded text-neutral-400 hover:text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Exercises in day */}
                  <div className="space-y-1 mb-2">
                    {day.exerciseIds.map((exId) => {
                      const ex = exercises.find((e) => e.id === exId);
                      return (
                        <div
                          key={exId}
                          className="flex items-center justify-between text-xs py-1 px-2 rounded bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                        >
                          <span className="text-neutral-800 dark:text-neutral-200">
                            {ex?.name || 'Exercise removed'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleExerciseInDay(day.id, exId)}
                            className="text-neutral-400 hover:text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedDayIdForAssign(day.id)}
                    className="text-[11px] font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 flex items-center space-x-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Assign Exercises</span>
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddDayToEdit}
                className="w-full py-2 rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:border-neutral-900 flex items-center justify-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Day</span>
              </button>
            </div>

            <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex justify-end space-x-2 mt-4">
              <button
                type="button"
                onClick={() => setEditingSplit(null)}
                className="px-3.5 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-4 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold uppercase tracking-wider"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXERCISE ASSIGNMENT SHEET */}
      {selectedDayIdForAssign && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-[#121212] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800 mb-3">
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Assign Exercises
              </h3>
              <button
                onClick={() => setSelectedDayIdForAssign(null)}
                className="p-1 text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative mb-3">
              <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
              <input
                type="text"
                value={exerciseSearch}
                onChange={(e) => setExerciseSearch(e.target.value)}
                placeholder="Search..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs focus:outline-none"
              />
            </div>

            <div className="overflow-y-auto flex-1 space-y-1.5 pr-1">
              {exercises
                .filter((e) => e.name.toLowerCase().includes(exerciseSearch.toLowerCase()))
                .map((ex) => {
                  const targetDay = editingDays.find((d) => d.id === selectedDayIdForAssign);
                  const isAssigned = targetDay?.exerciseIds.includes(ex.id);

                  return (
                    <button
                      key={ex.id}
                      onClick={() => handleToggleExerciseInDay(selectedDayIdForAssign, ex.id)}
                      className={`w-full text-left p-2.5 rounded-xl border flex items-center justify-between transition-colors ${
                        isAssigned
                          ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white'
                          : 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-semibold">{ex.name}</div>
                        <div className={`text-[10px] font-mono uppercase ${isAssigned ? 'opacity-80' : 'text-neutral-400'}`}>
                          {ex.category}
                        </div>
                      </div>
                      {isAssigned && <Check className="w-4 h-4 stroke-[2.5]" />}
                    </button>
                  );
                })}
            </div>

            <button
              onClick={() => setSelectedDayIdForAssign(null)}
              className="mt-3 w-full py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs font-semibold text-neutral-900 dark:text-neutral-100"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* DELETE SPLIT CONFIRMATION */}
      {splitToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-xs bg-white dark:bg-[#121212] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 text-center shadow-xl">
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mb-2">
              Delete Split?
            </h3>
            <p className="text-xs text-neutral-500 mb-5">
              Past workout sessions logged under "{splitToDelete.name}" will remain intact for your records.
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => setSplitToDelete(null)}
                className="flex-1 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await deleteSplit(splitToDelete.id);
                  setSplitToDelete(null);
                }}
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
