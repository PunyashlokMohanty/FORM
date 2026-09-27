import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WorkoutProvider } from './context/WorkoutContext';
import { Navbar } from './components/Navbar';
import { BottomTabBar } from './components/BottomTabBar';

import { AuthPage } from './pages/AuthPage';
import { TodayPage } from './pages/TodayPage';
import { ActiveWorkoutPage } from './pages/ActiveWorkoutPage';
import { SplitsPage } from './pages/SplitsPage';
import { ExercisesPage } from './pages/ExercisesPage';
import { HistoryPage } from './pages/HistoryPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafafa] dark:bg-[#0a0a0a] text-neutral-900 dark:text-neutral-100">
        <div className="flex items-center space-x-2 animate-pulse">
          <span className="font-extrabold tracking-tight text-3xl font-sans">FORM</span>
          <span className="w-2.5 h-2.5 rounded-full bg-[#e8321c]" />
        </div>
        <span className="text-[11px] font-mono uppercase text-neutral-400 mt-2 tracking-widest">
          Loading Data
        </span>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <WorkoutProvider>
      <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0a] text-neutral-900 dark:text-neutral-100 font-sans transition-colors selection:bg-neutral-800 selection:text-white">
        <Navbar />

        <main className="min-h-[calc(100vh-3.5rem)]">
          <Routes>
            <Route path="/" element={<TodayPage />} />
            <Route path="/active" element={<ActiveWorkoutPage />} />
            <Route path="/splits" element={<SplitsPage />} />
            <Route path="/exercises" element={<ExercisesPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <BottomTabBar />
      </div>
    </WorkoutProvider>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
