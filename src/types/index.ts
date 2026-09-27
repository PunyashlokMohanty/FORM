export type WeightUnit = 'lbs' | 'kg';

export type ExerciseCategory =
  | 'barbell'
  | 'dumbbell'
  | 'machine'
  | 'bodyweight'
  | 'cable'
  | 'cardio';

export interface PersonalBests {
  bestWeight?: {
    value: number; // in lbs
    reps: number;
    date: string;
    sessionId: string;
  };
  bestEstimated1RM?: {
    value: number; // in lbs
    weight: number;
    reps: number;
    date: string;
    sessionId: string;
  };
  bestRepsAtWeight?: Record<string, number>; // key: weight as string integer, val: max reps
}

export interface Exercise {
  id: string;
  name: string;
  category: ExerciseCategory;
  isCustom: boolean;
  notes?: string;
  personalBests?: PersonalBests;
  createdAt?: string;
  updatedAt?: string;
}

export interface SplitDay {
  id: string;
  name: string;
  order: number;
  exerciseIds: string[];
}

export interface Split {
  id: string;
  name: string;
  isActive: boolean;
  days: SplitDay[];
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkoutSet {
  id: string;
  exerciseId: string;
  exerciseName: string;
  order: number;
  weight: number; // canonical weight stored in lbs
  reps: number;
  rpe?: number; // 1 to 10
  isWarmup: boolean;
  isPR?: boolean;
  isCompleted: boolean;
  timestamp: string;
}

export interface PRAchievement {
  exerciseId: string;
  exerciseName: string;
  prType: 'weight' | '1rm' | 'reps';
  value: number;
  previousValue?: number;
  weight?: number;
  reps?: number;
}

export interface WorkoutSession {
  id: string;
  splitId?: string;
  splitName?: string;
  dayId?: string;
  dayName: string;
  startedAt: string;
  completedAt?: string;
  durationSeconds: number;
  totalVolume: number; // in lbs
  totalSets: number;
  prsAchieved: PRAchievement[];
  isCompleted: boolean;
  sets: WorkoutSet[];
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  weightUnit: WeightUnit;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  defaultRestDuration: number;
  activeSplitId: string | null;
  streak: number;
  lastWorkoutDate: string | null;
  createdAt?: string;
  updatedAt?: string;
}
