import { Exercise, ExerciseCategory } from '../types';

export interface BuiltinExerciseTemplate {
  name: string;
  category: ExerciseCategory;
  notes?: string;
}

export const BUILTIN_EXERCISES: BuiltinExerciseTemplate[] = [
  // Barbell
  { name: 'Barbell Bench Press', category: 'barbell', notes: 'Primary horizontal push' },
  { name: 'Barbell Squat', category: 'barbell', notes: 'Back squat to depth' },
  { name: 'Barbell Deadlift', category: 'barbell', notes: 'Conventional or sumo deadlift' },
  { name: 'Overhead Press (OHP)', category: 'barbell', notes: 'Standing barbell shoulder press' },
  { name: 'Barbell Bent-Over Row', category: 'barbell', notes: 'Upper back and lats' },
  { name: 'Romanian Deadlift (RDL)', category: 'barbell', notes: 'Hamstrings and glutes' },
  { name: 'Incline Barbell Bench Press', category: 'barbell', notes: 'Upper chest focus' },
  { name: 'Barbell Bicep Curl', category: 'barbell', notes: 'Strict standing curl' },
  { name: 'Barbell Hip Thrust', category: 'barbell', notes: 'Glute-focused extension' },
  { name: 'Close-Grip Bench Press', category: 'barbell', notes: 'Triceps and chest' },

  // Dumbbell
  { name: 'Dumbbell Bench Press', category: 'dumbbell', notes: 'Flat chest press' },
  { name: 'Incline Dumbbell Press', category: 'dumbbell', notes: 'Incline angle 30-45 deg' },
  { name: 'Dumbbell Shoulder Press', category: 'dumbbell', notes: 'Seated or standing' },
  { name: 'Dumbbell Lateral Raise', category: 'dumbbell', notes: 'Side deltoid isolation' },
  { name: 'Dumbbell Bicep Curl', category: 'dumbbell', notes: 'Supinated curls' },
  { name: 'Dumbbell Hammer Curl', category: 'dumbbell', notes: 'Brachialis & forearms' },
  { name: 'Dumbbell Romanian Deadlift', category: 'dumbbell', notes: 'Posterior chain' },
  { name: 'Dumbbell Bulgarian Split Squat', category: 'dumbbell', notes: 'Unilateral quad and glute' },
  { name: 'Dumbbell Rear Delt Fly', category: 'dumbbell', notes: 'Posterior deltoids' },
  { name: 'Dumbbell Tricep Extension', category: 'dumbbell', notes: 'Overhead tricep work' },

  // Machine
  { name: 'Leg Press', category: 'machine', notes: '45-degree sled or horizontal' },
  { name: 'Seated Leg Curl', category: 'machine', notes: 'Hamstring isolation' },
  { name: 'Leg Extension', category: 'machine', notes: 'Quad isolation' },
  { name: 'Chest Press Machine', category: 'machine', notes: 'Pectoral strength' },
  { name: 'Seated Cable Row', category: 'machine', notes: 'Mid back and lats' },
  { name: 'Lat Pulldown', category: 'machine', notes: 'Vertical pulling' },
  { name: 'Pec Deck / Chest Fly', category: 'machine', notes: 'Chest adduction' },
  { name: 'Calf Raise Machine', category: 'machine', notes: 'Standing or seated' },
  { name: 'Hack Squat', category: 'machine', notes: 'Deep knee flexion' },

  // Cable
  { name: 'Cable Tricep Pushdown', category: 'cable', notes: 'Rope or straight bar' },
  { name: 'Cable Face Pull', category: 'cable', notes: 'Rotator cuff and rear delts' },
  { name: 'Cable Lateral Raise', category: 'cable', notes: 'Constant tension delts' },
  { name: 'Cable Bicep Curl', category: 'cable', notes: 'Continuous tension' },
  { name: 'Cable Fly', category: 'cable', notes: 'High-to-low or low-to-high' },

  // Bodyweight
  { name: 'Pull-Up', category: 'bodyweight', notes: 'Overhand grip' },
  { name: 'Chin-Up', category: 'bodyweight', notes: 'Underhand grip' },
  { name: 'Dip', category: 'bodyweight', notes: 'Chest or tricep focus' },
  { name: 'Push-Up', category: 'bodyweight', notes: 'Strict form bodyweight' },
  { name: 'Hanging Leg Raise', category: 'bodyweight', notes: 'Abdominal flexion' },

  // Cardio
  { name: 'Treadmill Run', category: 'cardio', notes: 'Incline or flat running' },
  { name: 'Stationary Bike', category: 'cardio', notes: 'Low impact conditioning' },
  { name: 'Rowing Machine', category: 'cardio', notes: 'Full-body cardiovascular' }
];

export interface SplitTemplate {
  name: string;
  description: string;
  days: {
    name: string;
    exercises: string[]; // names of exercises from BUILTIN_EXERCISES
  }[];
}

export const SPLIT_TEMPLATES: SplitTemplate[] = [
  {
    name: 'Push / Pull / Legs (PPL)',
    description: 'Classic 3-day or 6-day hypertrophy routine grouping pushing, pulling, and lower-body movements.',
    days: [
      {
        name: 'Push Day',
        exercises: [
          'Barbell Bench Press',
          'Overhead Press (OHP)',
          'Incline Dumbbell Press',
          'Dumbbell Lateral Raise',
          'Cable Tricep Pushdown'
        ]
      },
      {
        name: 'Pull Day',
        exercises: [
          'Barbell Deadlift',
          'Barbell Bent-Over Row',
          'Lat Pulldown',
          'Cable Face Pull',
          'Barbell Bicep Curl'
        ]
      },
      {
        name: 'Leg Day',
        exercises: [
          'Barbell Squat',
          'Romanian Deadlift (RDL)',
          'Leg Press',
          'Seated Leg Curl',
          'Calf Raise Machine'
        ]
      }
    ]
  },
  {
    name: 'Upper / Lower',
    description: 'High-frequency 4-day split balancing upper body compound lifts with lower body power.',
    days: [
      {
        name: 'Upper A',
        exercises: [
          'Barbell Bench Press',
          'Barbell Bent-Over Row',
          'Overhead Press (OHP)',
          'Pull-Up',
          'Dumbbell Bicep Curl'
        ]
      },
      {
        name: 'Lower A',
        exercises: [
          'Barbell Squat',
          'Romanian Deadlift (RDL)',
          'Leg Press',
          'Seated Leg Curl',
          'Calf Raise Machine'
        ]
      },
      {
        name: 'Upper B',
        exercises: [
          'Incline Dumbbell Press',
          'Lat Pulldown',
          'Dumbbell Shoulder Press',
          'Cable Face Pull',
          'Cable Tricep Pushdown'
        ]
      },
      {
        name: 'Lower B',
        exercises: [
          'Barbell Deadlift',
          'Dumbbell Bulgarian Split Squat',
          'Leg Extension',
          'Seated Leg Curl',
          'Hanging Leg Raise'
        ]
      }
    ]
  },
  {
    name: 'Full Body (3x / week)',
    description: 'Maximum efficiency hitting every major muscle group across three non-consecutive days.',
    days: [
      {
        name: 'Full Body A',
        exercises: [
          'Barbell Squat',
          'Barbell Bench Press',
          'Barbell Bent-Over Row',
          'Dumbbell Lateral Raise',
          'Cable Tricep Pushdown'
        ]
      },
      {
        name: 'Full Body B',
        exercises: [
          'Barbell Deadlift',
          'Overhead Press (OHP)',
          'Lat Pulldown',
          'Incline Dumbbell Press',
          'Barbell Bicep Curl'
        ]
      }
    ]
  },
  {
    name: 'Bro Split (5-Day Body-Part)',
    description: 'Dedicated focus on individual muscle groups per training day.',
    days: [
      {
        name: 'Chest Day',
        exercises: [
          'Barbell Bench Press',
          'Incline Dumbbell Press',
          'Chest Press Machine',
          'Dip'
        ]
      },
      {
        name: 'Back Day',
        exercises: [
          'Barbell Deadlift',
          'Barbell Bent-Over Row',
          'Lat Pulldown',
          'Seated Cable Row'
        ]
      },
      {
        name: 'Shoulders Day',
        exercises: [
          'Overhead Press (OHP)',
          'Dumbbell Lateral Raise',
          'Cable Face Pull',
          'Dumbbell Rear Delt Fly'
        ]
      },
      {
        name: 'Legs Day',
        exercises: [
          'Barbell Squat',
          'Leg Press',
          'Romanian Deadlift (RDL)',
          'Seated Leg Curl',
          'Calf Raise Machine'
        ]
      },
      {
        name: 'Arms Day',
        exercises: [
          'Barbell Bicep Curl',
          'Close-Grip Bench Press',
          'Dumbbell Hammer Curl',
          'Cable Tricep Pushdown'
        ]
      }
    ]
  }
];
