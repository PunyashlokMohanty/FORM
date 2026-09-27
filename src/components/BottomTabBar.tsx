import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  CalendarDays,
  Layers,
  Dumbbell,
  Clock,
  TrendingUp,
  Settings as SettingsIcon,
} from 'lucide-react';
import { useWorkout } from '../context/WorkoutContext';

export const BottomTabBar: React.FC = () => {
  const { activeWorkout } = useWorkout();

  const navItems = [
    { label: 'Today', path: '/', icon: CalendarDays },
    { label: 'Splits', path: '/splits', icon: Layers },
    { label: 'Exercises', path: '/exercises', icon: Dumbbell },
    { label: 'History', path: '/history', icon: Clock },
    { label: 'Analytics', path: '/analytics', icon: TrendingUp },
    { label: 'Settings', path: '/settings', icon: SettingsIcon },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#fafafa]/95 dark:bg-[#0a0a0a]/95 backdrop-blur-md border-t border-neutral-200 dark:border-neutral-800 pb-safe transition-colors">
      <div className="max-w-md mx-auto flex items-center justify-around h-14 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                  isActive
                    ? 'text-neutral-900 dark:text-neutral-100 font-semibold'
                    : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                }`
              }
            >
              <div className="relative">
                <Icon className="w-5 h-5 transition-transform active:scale-95" />
                {item.path === '/' && activeWorkout && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#e8321c]" />
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
