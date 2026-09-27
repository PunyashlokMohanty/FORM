import React, { useState, useMemo } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { useAuth } from '../context/AuthContext';
import { Trophy, TrendingUp, BarChart2, Flame, Award } from 'lucide-react';
import { formatWeight } from '../lib/units';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
} from 'recharts';

export const AnalyticsPage: React.FC = () => {
  const { exercises, sessions } = useWorkout();
  const { profile } = useAuth();
  const unit = profile?.weightUnit || 'lbs';

  // Selected exercise for progression chart
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>(() => {
    return exercises[0]?.id || '';
  });

  const selectedExercise = useMemo(() => {
    return exercises.find((e) => e.id === selectedExerciseId) || exercises[0] || null;
  }, [exercises, selectedExerciseId]);

  // All PRs from exercises that have personal bests
  const allTimePRs = useMemo(() => {
    const list: {
      exerciseName: string;
      category: string;
      bestWeight?: number;
      best1RM?: number;
      date?: string;
    }[] = [];

    exercises.forEach((ex) => {
      const bw = ex.personalBests?.bestWeight?.value;
      const b1 = ex.personalBests?.bestEstimated1RM?.value;
      if (bw || b1) {
        list.push({
          exerciseName: ex.name,
          category: ex.category,
          bestWeight: bw,
          best1RM: b1,
          date: ex.personalBests?.bestWeight?.date || ex.personalBests?.bestEstimated1RM?.date,
        });
      }
    });

    return list.sort((a, b) => (b.bestWeight || 0) - (a.bestWeight || 0));
  }, [exercises]);

  // Progression Chart Data for Selected Exercise
  const progressionData = useMemo(() => {
    if (!selectedExercise) return [];

    return sessions
      .slice()
      .reverse()
      .map((s) => {
        const sets = (s.sets || []).filter(
          (set) => set.exerciseId === selectedExercise.id && set.isCompleted && !set.isWarmup
        );
        if (sets.length === 0) return null;

        const maxWeight = Math.max(...sets.map((set) => set.weight));
        const max1RM = Math.max(...sets.map((set) => set.weight * (1 + set.reps / 30)));

        return {
          date: new Date(s.startedAt).toLocaleDateString('en-US', {
            month: 'numeric',
            day: 'numeric',
          }),
          weight: maxWeight,
          estimated1RM: Math.round(max1RM * 10) / 10,
        };
      })
      .filter((d): d is NonNullable<typeof d> => Boolean(d));
  }, [sessions, selectedExercise]);

  // Volume Over Time Chart Data (Last 10 sessions)
  const volumeData = useMemo(() => {
    return sessions
      .slice(0, 10)
      .reverse()
      .map((s) => ({
        date: new Date(s.startedAt).toLocaleDateString('en-US', {
          month: 'numeric',
          day: 'numeric',
        }),
        volume: s.totalVolume,
        dayName: s.dayName,
      }));
  }, [sessions]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 font-sans">
            Analytics
          </h1>
          <p className="text-xs text-neutral-500 font-mono mt-0.5">
            Auto-detected records and volume progression
          </p>
        </div>
      </div>

      {/* PR Showcase Banner */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#121212] p-5 mb-8 shadow-xs">
        <div className="flex items-center space-x-2 mb-4">
          <Trophy className="w-5 h-5 text-[#e8321c]" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 font-mono">
            Personal Records
          </h2>
        </div>

        {allTimePRs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {allTimePRs.slice(0, 6).map((pr, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl border border-neutral-100 dark:border-neutral-800/80 bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center justify-between"
              >
                <div className="truncate mr-2">
                  <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                    {pr.exerciseName}
                  </div>
                  <div className="text-[10px] font-mono uppercase text-neutral-400">
                    {pr.category}
                  </div>
                </div>

                <div className="text-right shrink-0 font-numeric">
                  {pr.bestWeight && (
                    <div className="text-xs font-bold text-[#e8321c]">
                      {formatWeight(pr.bestWeight, unit)}
                    </div>
                  )}
                  {pr.best1RM && (
                    <div className="text-[10px] font-mono text-neutral-400">
                      1RM: {formatWeight(pr.best1RM, unit)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs font-mono text-neutral-400 py-3 text-center">
            Complete workouts to automatically discover and record your personal bests.
          </p>
        )}
      </div>

      {/* Exercise Progression Graph */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#121212] p-5 mb-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-neutral-500" />
              <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                Exercise Progression
              </h3>
            </div>
            <span className="text-[11px] font-mono text-neutral-400">
              Weight & Estimated 1RM trends
            </span>
          </div>

          {/* Exercise Picker */}
          <select
            value={selectedExerciseId}
            onChange={(e) => setSelectedExerciseId(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs font-medium text-neutral-800 dark:text-neutral-200 focus:outline-none"
          >
            {exercises.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name}
              </option>
            ))}
          </select>
        </div>

        {progressionData.length > 1 ? (
          <div className="h-56 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progressionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" opacity={0.2} />
                <XAxis dataKey="date" stroke="#888888" fontSize={10} tickLine={false} />
                <YAxis stroke="#888888" fontSize={10} tickLine={false} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#171717',
                    borderColor: '#333',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#fff',
                  }}
                  formatter={(val: any, name: any) => [
                    `${val} ${unit}`,
                    name === 'weight' ? 'Top Weight' : 'Est. 1RM',
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#ffffff"
                  strokeWidth={2}
                  name="weight"
                  dot={{ r: 3, fill: '#ffffff' }}
                />
                <Line
                  type="monotone"
                  dataKey="estimated1RM"
                  stroke="#e8321c"
                  strokeWidth={2}
                  name="estimated1RM"
                  dot={{ r: 3, fill: '#e8321c' }}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center space-x-6 text-[10px] font-mono text-neutral-400 mt-2">
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-0.5 bg-neutral-900 dark:bg-white" />
                <span>Heaviest Lift</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2.5 h-0.5 bg-[#e8321c]" />
                <span>Estimated 1RM</span>
              </span>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl my-4">
            <p className="text-xs font-mono text-neutral-400">
              Log at least 2 sessions with {selectedExercise?.name || 'this exercise'} to generate charts.
            </p>
          </div>
        )}
      </div>

      {/* Total Volume Over Time */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#121212] p-5 shadow-xs">
        <div className="flex items-center space-x-2 mb-2">
          <BarChart2 className="w-4 h-4 text-neutral-500" />
          <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
            Training Volume
          </h3>
        </div>
        <p className="text-[11px] font-mono text-neutral-400 mb-4">
          Total weight moved across completed working sets (last 10 sessions)
        </p>

        {volumeData.length > 0 ? (
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" opacity={0.2} />
                <XAxis dataKey="date" stroke="#888888" fontSize={10} tickLine={false} />
                <YAxis stroke="#888888" fontSize={10} tickLine={false} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#171717',
                    borderColor: '#333',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#fff',
                  }}
                  formatter={(val: any) => [`${formatWeight(Number(val), unit)}`, 'Total Volume']}
                />
                <Bar dataKey="volume" fill="#a3a3a3" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="p-8 text-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl">
            <p className="text-xs font-mono text-neutral-400">
              No session volume data available yet
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
