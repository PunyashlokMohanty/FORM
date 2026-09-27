import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWorkout } from '../context/WorkoutContext';
import {
  Download,
  Volume2,
  Vibrate,
  Scale,
  Clock,
  LogOut,
  User as UserIcon,
  Check,
  FileSpreadsheet,
  FileJson,
} from 'lucide-react';
import { playRestCompleteTone } from '../lib/audio';
import { WeightUnit } from '../types';
import { formatWeight, toDisplayWeight } from '../lib/units';

export const SettingsPage: React.FC = () => {
  const { profile, updateUserProfile, signOut, user } = useAuth();
  const { splits, exercises, sessions } = useWorkout();

  const [displayNameInput, setDisplayNameInput] = useState<string>(profile?.displayName || '');
  const [isSavedNotice, setIsSavedNotice] = useState<boolean>(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayNameInput.trim()) return;
    try {
      await updateUserProfile({ displayName: displayNameInput.trim() });
      setIsSavedNotice(true);
      setTimeout(() => setIsSavedNotice(false), 2000);
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
  };

  const handleToggleSound = async () => {
    const current = profile?.soundEnabled ?? true;
    await updateUserProfile({ soundEnabled: !current });
    if (!current) {
      // test tone
      playRestCompleteTone(true, false);
    }
  };

  const handleToggleVibration = async () => {
    const current = profile?.vibrationEnabled ?? true;
    await updateUserProfile({ vibrationEnabled: !current });
    if (!current && 'vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
  };

  const handleChangeUnit = async (unit: WeightUnit) => {
    await updateUserProfile({ weightUnit: unit });
  };

  const handleChangeRestDuration = async (seconds: number) => {
    await updateUserProfile({ defaultRestDuration: seconds });
  };

  // --- DATA EXPORT: CSV ---
  const handleExportCSV = () => {
    const unit = profile?.weightUnit || 'lbs';
    const rows = [
      ['Date', 'Split', 'Day', 'Exercise', `Weight (${unit})`, 'Reps', 'RPE', 'Warmup', 'PR'],
    ];

    sessions.forEach((s) => {
      const dateStr = new Date(s.startedAt).toISOString().split('T')[0];
      (s.sets || []).forEach((set) => {
        const displayW = toDisplayWeight(set.weight, unit);
        rows.push([
          dateStr,
          `"${s.splitName || ''}"`,
          `"${s.dayName || ''}"`,
          `"${set.exerciseName || ''}"`,
          String(displayW),
          String(set.reps),
          String(set.rpe || ''),
          set.isWarmup ? 'YES' : 'NO',
          set.isPR ? 'YES' : 'NO',
        ]);
      });
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `form_workout_data_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- DATA EXPORT: JSON BACKUP ---
  const handleExportJSON = () => {
    const fullBackup = {
      exportedAt: new Date().toISOString(),
      user: {
        email: profile?.email,
        displayName: profile?.displayName,
        weightUnit: profile?.weightUnit,
        streak: profile?.streak,
      },
      splits,
      exercises,
      sessions,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullBackup, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `form_full_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 font-sans">
            Settings
          </h1>
          <p className="text-xs text-neutral-500 font-mono mt-0.5">
            Preferences & Data Portability
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* User Profile */}
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#121212] p-5 shadow-xs">
          <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mb-3 flex items-center space-x-2">
            <UserIcon className="w-4 h-4 text-neutral-500" />
            <span>Profile Details</span>
          </h3>

          <form onSubmit={handleSaveProfile} className="space-y-3">
            <div>
              <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">
                Account Email
              </label>
              <input
                type="text"
                disabled
                value={user?.email || ''}
                className="w-full px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800/50 text-neutral-500 text-xs font-mono border border-neutral-200 dark:border-neutral-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-neutral-400 mb-1">
                Athlete Name
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={displayNameInput}
                  onChange={(e) => setDisplayNameInput(e.target.value)}
                  placeholder="Your Name"
                  className="flex-1 px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-xs font-semibold uppercase tracking-wider"
                >
                  {isSavedNotice ? 'Saved' : 'Save'}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Preferences */}
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#121212] p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mb-3 flex items-center space-x-2">
            <Scale className="w-4 h-4 text-neutral-500" />
            <span>Training Preferences</span>
          </h3>

          {/* Weight Unit */}
          <div className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-800/80">
            <div>
              <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                Weight Measurement System
              </div>
              <div className="text-[10px] font-mono text-neutral-400">
                Preferred unit for weights & 1RM
              </div>
            </div>

            <div className="flex rounded-xl bg-neutral-100 dark:bg-neutral-800 p-1">
              <button
                onClick={() => handleChangeUnit('lbs')}
                className={`px-3 py-1 text-xs font-mono rounded-lg transition-colors ${
                  profile?.weightUnit === 'lbs'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 font-bold shadow-xs'
                    : 'text-neutral-500'
                }`}
              >
                LBS
              </button>
              <button
                onClick={() => handleChangeUnit('kg')}
                className={`px-3 py-1 text-xs font-mono rounded-lg transition-colors ${
                  profile?.weightUnit === 'kg'
                    ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 font-bold shadow-xs'
                    : 'text-neutral-500'
                }`}
              >
                KG
              </button>
            </div>
          </div>

          {/* Rest Duration */}
          <div className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-800/80">
            <div>
              <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                Default Rest Timer
              </div>
              <div className="text-[10px] font-mono text-neutral-400">
                Auto-start duration after completing a set
              </div>
            </div>

            <div className="flex space-x-1.5 font-numeric text-xs">
              {[60, 90, 120, 180].map((sec) => (
                <button
                  key={sec}
                  onClick={() => handleChangeRestDuration(sec)}
                  className={`px-2.5 py-1 rounded-lg border font-mono transition-colors ${
                    (profile?.defaultRestDuration || 90) === sec
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-neutral-900 dark:border-white font-bold'
                      : 'border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>

          {/* Sound Notification */}
          <div className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-800/80">
            <div>
              <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                Rest Timer Audio Chimes
              </div>
              <div className="text-[10px] font-mono text-neutral-400">
                Two-tone chime when rest expires
              </div>
            </div>

            <button
              onClick={handleToggleSound}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                profile?.soundEnabled ?? true ? 'bg-neutral-900 dark:bg-white' : 'bg-neutral-300 dark:bg-neutral-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white dark:bg-neutral-900 transition-transform ${
                  profile?.soundEnabled ?? true ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Vibration Notification */}
          <div className="flex items-center justify-between py-2">
            <div>
              <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                Device Vibration
              </div>
              <div className="text-[10px] font-mono text-neutral-400">
                Haptic vibration pulses on timer completion
              </div>
            </div>

            <button
              onClick={handleToggleVibration}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                profile?.vibrationEnabled ?? true
                  ? 'bg-neutral-900 dark:bg-white'
                  : 'bg-neutral-300 dark:bg-neutral-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white dark:bg-neutral-900 transition-transform ${
                  profile?.vibrationEnabled ?? true ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Data Portability / Export */}
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#121212] p-5 shadow-xs">
          <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 mb-1 flex items-center space-x-2">
            <Download className="w-4 h-4 text-neutral-500" />
            <span>Export My Data</span>
          </h3>
          <p className="text-xs text-neutral-500 mb-4">
            Download your training data for spreadsheets or backup archive.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleExportCSV}
              className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-neutral-900 dark:hover:border-neutral-100 transition-colors flex items-center space-x-3 text-left group"
            >
              <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 group-hover:text-black dark:group-hover:text-white">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                  Export Sets (CSV)
                </div>
                <div className="text-[10px] font-mono text-neutral-400">
                  For Excel & Google Sheets
                </div>
              </div>
            </button>

            <button
              onClick={handleExportJSON}
              className="p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-neutral-900 dark:hover:border-neutral-100 transition-colors flex items-center space-x-3 text-left group"
            >
              <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 group-hover:text-black dark:group-hover:text-white">
                <FileJson className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                  Full Backup (JSON)
                </div>
                <div className="text-[10px] font-mono text-neutral-400">
                  Splits, exercises & logs
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Sign Out */}
        <div className="pt-2">
          <button
            onClick={signOut}
            className="w-full py-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 hover:border-red-500 text-xs font-mono text-red-500 flex items-center justify-center space-x-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
