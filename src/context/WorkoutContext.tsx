import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import {
  Split,
  SplitDay,
  Exercise,
  WorkoutSession,
  WorkoutSet,
  PRAchievement,
  PersonalBests,
} from '../types';
import { BUILTIN_EXERCISES, SPLIT_TEMPLATES } from '../lib/constants';
import { calculateEstimated1RM, calculateVolume } from '../lib/epley';

interface ActiveWorkoutState {
  sessionId: string;
  splitId?: string;
  splitName?: string;
  dayId?: string;
  dayName: string;
  startedAt: string;
  exercises: {
    exercise: Exercise;
    sets: WorkoutSet[];
  }[];
}

interface WorkoutContextType {
  splits: Split[];
  exercises: Exercise[];
  sessions: WorkoutSession[];
  activeSplit: Split | null;
  activeWorkout: ActiveWorkoutState | null;
  loadingData: boolean;
  latestPRs: PRAchievement[];
  clearLatestPRs: () => void;
  // Split actions
  createSplit: (name: string, days: Omit<SplitDay, 'id'>[]) => Promise<string>;
  updateSplit: (splitId: string, updates: Partial<Split>) => Promise<void>;
  deleteSplit: (splitId: string) => Promise<void>;
  setActiveSplit: (splitId: string) => Promise<void>;
  createSplitFromTemplate: (templateName: string) => Promise<string>;
  // Exercise actions
  createExercise: (name: string, category: Exercise['category'], notes?: string) => Promise<string>;
  updateExercise: (exerciseId: string, updates: Partial<Exercise>) => Promise<void>;
  deleteExercise: (exerciseId: string) => Promise<void>;
  // Active workout actions
  startWorkout: (splitId?: string, dayId?: string, dayName?: string, initialExercises?: Exercise[]) => void;
  addSetToActive: (exerciseId: string, isWarmup?: boolean) => void;
  updateActiveSet: (exerciseId: string, setId: string, updates: Partial<WorkoutSet>) => void;
  removeActiveSet: (exerciseId: string, setId: string) => void;
  addExerciseToActiveWorkout: (exercise: Exercise) => void;
  removeExerciseFromActiveWorkout: (exerciseId: string) => void;
  finishWorkout: () => Promise<PRAchievement[]>;
  discardWorkout: () => void;
  // History editing & PR recalibration
  updatePastSet: (sessionId: string, updatedSet: WorkoutSet) => Promise<void>;
  deletePastSet: (sessionId: string, setId: string) => Promise<void>;
  deletePastSession: (sessionId: string) => Promise<void>;
  recalibrateExercisePRs: (exerciseId: string) => Promise<void>;
  // Reference queries
  getLastPerformance: (exerciseId: string) => WorkoutSet[] | null;
}

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

const ACTIVE_WORKOUT_KEY = 'form_active_workout_state';

export const WorkoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, updateUserProfile } = useAuth();

  const [splits, setSplits] = useState<Split[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [latestPRs, setLatestPRs] = useState<PRAchievement[]>([]);

  // Active workout state with localStorage fallback
  const [activeWorkout, setActiveWorkout] = useState<ActiveWorkoutState | null>(() => {
    try {
      const saved = localStorage.getItem(ACTIVE_WORKOUT_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Sync active workout to localStorage
  useEffect(() => {
    if (activeWorkout) {
      localStorage.setItem(ACTIVE_WORKOUT_KEY, JSON.stringify(activeWorkout));
    } else {
      localStorage.removeItem(ACTIVE_WORKOUT_KEY);
    }
  }, [activeWorkout]);

  // Real-time synchronization with Firestore
  useEffect(() => {
    if (!user) {
      setSplits([]);
      setExercises([]);
      setSessions([]);
      setLoadingData(false);
      return;
    }

    setLoadingData(true);

    // 1. Listen to Exercises
    const exercisesRef = collection(db, 'users', user.uid, 'exercises');
    const unsubExercises = onSnapshot(
      exercisesRef,
      async (snapshot) => {
        if (snapshot.empty) {
          // Auto-seed standard library on first use
          const batch = writeBatch(db);
          BUILTIN_EXERCISES.forEach((item) => {
            const newDoc = doc(exercisesRef);
            batch.set(newDoc, {
              name: item.name,
              category: item.category,
              notes: item.notes || '',
              isCustom: false,
              personalBests: {},
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          });
          try {
            await batch.commit();
          } catch (e) {
            console.error('Error auto-seeding built-in exercises:', e);
          }
        } else {
          const exList: Exercise[] = snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<Exercise, 'id'>),
          }));
          setExercises(exList.sort((a, b) => a.name.localeCompare(b.name)));
        }
      },
      (err) => console.warn('Exercises snapshot error:', err)
    );

    // 2. Listen to Splits
    const splitsRef = collection(db, 'users', user.uid, 'splits');
    const unsubSplits = onSnapshot(
      splitsRef,
      (snapshot) => {
        const splitList: Split[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Split, 'id'>),
        }));
        setSplits(splitList);
      },
      (err) => console.warn('Splits snapshot error:', err)
    );

    // 3. Listen to Sessions (ordered chronologically descending)
    const sessionsRef = collection(db, 'users', user.uid, 'sessions');
    const qSessions = query(sessionsRef, orderBy('startedAt', 'desc'));
    const unsubSessions = onSnapshot(
      qSessions,
      (snapshot) => {
        const sessionList: WorkoutSession[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<WorkoutSession, 'id'>),
        }));
        setSessions(sessionList);
        setLoadingData(false);
      },
      (err) => {
        console.warn('Sessions snapshot error:', err);
        setLoadingData(false);
      }
    );

    return () => {
      unsubExercises();
      unsubSplits();
      unsubSessions();
    };
  }, [user]);

  // Active split computed
  const activeSplit = useMemo(() => {
    if (!splits.length) return null;
    if (profile?.activeSplitId) {
      const found = splits.find((s) => s.id === profile.activeSplitId);
      if (found) return found;
    }
    return splits.find((s) => s.isActive) || splits[0] || null;
  }, [splits, profile?.activeSplitId]);

  // Clear latest PRs
  const clearLatestPRs = () => setLatestPRs([]);

  // --- SPLIT MANAGEMENT ---
  const createSplit = async (name: string, days: Omit<SplitDay, 'id'>[]): Promise<string> => {
    if (!user) throw new Error('Unauthenticated');
    const splitRef = doc(collection(db, 'users', user.uid, 'splits'));
    const splitDays: SplitDay[] = days.map((d, index) => ({
      ...d,
      id: `day_${Date.now()}_${index}`,
      order: index,
    }));

    const newSplit: Omit<Split, 'id'> = {
      name,
      isActive: splits.length === 0,
      days: splitDays,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(splitRef, newSplit);

    if (splits.length === 0 && profile) {
      await updateUserProfile({ activeSplitId: splitRef.id });
    }

    return splitRef.id;
  };

  const updateSplit = async (splitId: string, updates: Partial<Split>) => {
    if (!user) return;
    const splitRef = doc(db, 'users', user.uid, 'splits', splitId);
    await updateDoc(splitRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  };

  const deleteSplit = async (splitId: string) => {
    if (!user) return;
    // Non-destructive: simply delete split definition; past sessions stay untouched
    const splitRef = doc(db, 'users', user.uid, 'splits', splitId);
    await deleteDoc(splitRef);
    if (profile?.activeSplitId === splitId) {
      const remaining = splits.filter((s) => s.id !== splitId);
      await updateUserProfile({ activeSplitId: remaining[0]?.id || null });
    }
  };

  const setActiveSplit = async (splitId: string) => {
    if (!user) return;
    // Mark target split as active and others as inactive
    const batch = writeBatch(db);
    splits.forEach((s) => {
      const sRef = doc(db, 'users', user.uid, 'splits', s.id);
      batch.update(sRef, { isActive: s.id === splitId, updatedAt: new Date().toISOString() });
    });
    await batch.commit();
    await updateUserProfile({ activeSplitId: splitId });
  };

  const createSplitFromTemplate = async (templateName: string): Promise<string> => {
    const template = SPLIT_TEMPLATES.find((t) => t.name === templateName);
    if (!template) throw new Error('Template not found');

    const mappedDays: Omit<SplitDay, 'id'>[] = template.days.map((d, idx) => {
      const exerciseIds: string[] = [];
      d.exercises.forEach((exName) => {
        const found = exercises.find((e) => e.name.toLowerCase() === exName.toLowerCase());
        if (found) {
          exerciseIds.push(found.id);
        }
      });
      return {
        name: d.name,
        order: idx,
        exerciseIds,
      };
    });

    return await createSplit(template.name, mappedDays);
  };

  // --- EXERCISE MANAGEMENT ---
  const createExercise = async (name: string, category: Exercise['category'], notes?: string): Promise<string> => {
    if (!user) throw new Error('Unauthenticated');
    const exRef = doc(collection(db, 'users', user.uid, 'exercises'));
    const newEx: Omit<Exercise, 'id'> = {
      name,
      category,
      isCustom: true,
      notes: notes || '',
      personalBests: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(exRef, newEx);
    return exRef.id;
  };

  const updateExercise = async (exerciseId: string, updates: Partial<Exercise>) => {
    if (!user) return;
    const exRef = doc(db, 'users', user.uid, 'exercises', exerciseId);
    await updateDoc(exRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  };

  const deleteExercise = async (exerciseId: string) => {
    if (!user) return;
    // Non-destructive: delete exercise from library; historical sets retain snapshot data
    const exRef = doc(db, 'users', user.uid, 'exercises', exerciseId);
    await deleteDoc(exRef);
  };

  // --- ACTIVE WORKOUT LOGGING ---
  const startWorkout = (splitId?: string, dayId?: string, dayName?: string, initialExercises?: Exercise[]) => {
    let resolvedDayName = dayName || 'Free Workout';
    let targetExercises: Exercise[] = initialExercises || [];

    if (!initialExercises || initialExercises.length === 0) {
      if (splitId && dayId) {
        const targetSplit = splits.find((s) => s.id === splitId);
        const targetDay = targetSplit?.days.find((d) => d.id === dayId);
        if (targetDay) {
          resolvedDayName = targetDay.name;
          targetExercises = targetDay.exerciseIds
            .map((id) => exercises.find((e) => e.id === id))
            .filter((e): e is Exercise => Boolean(e));
        }
      }
    }

    const newActiveState: ActiveWorkoutState = {
      sessionId: `session_${Date.now()}`,
      splitId,
      splitName: splits.find((s) => s.id === splitId)?.name,
      dayId,
      dayName: resolvedDayName,
      startedAt: new Date().toISOString(),
      exercises: targetExercises.map((ex) => ({
        exercise: ex,
        sets: [
          // Initial blank set
          {
            id: `set_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            exerciseId: ex.id,
            exerciseName: ex.name,
            order: 1,
            weight: 0,
            reps: 0,
            rpe: 8,
            isWarmup: false,
            isCompleted: false,
            timestamp: new Date().toISOString(),
          },
        ],
      })),
    };

    setActiveWorkout(newActiveState);
  };

  const addSetToActive = (exerciseId: string, isWarmup = false) => {
    if (!activeWorkout) return;
    setActiveWorkout((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        exercises: prev.exercises.map((group) => {
          if (group.exercise.id !== exerciseId) return group;
          const nextOrder = group.sets.length + 1;
          const newSet: WorkoutSet = {
            id: `set_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            exerciseId,
            exerciseName: group.exercise.name,
            order: nextOrder,
            weight: 0,
            reps: 0,
            rpe: 8,
            isWarmup,
            isCompleted: false,
            timestamp: new Date().toISOString(),
          };
          return {
            ...group,
            sets: [...group.sets, newSet],
          };
        }),
      };
    });
  };

  const updateActiveSet = (exerciseId: string, setId: string, updates: Partial<WorkoutSet>) => {
    if (!activeWorkout) return;
    setActiveWorkout((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        exercises: prev.exercises.map((group) => {
          if (group.exercise.id !== exerciseId) return group;
          return {
            ...group,
            sets: group.sets.map((s) => (s.id === setId ? { ...s, ...updates } : s)),
          };
        }),
      };
    });
  };

  const removeActiveSet = (exerciseId: string, setId: string) => {
    if (!activeWorkout) return;
    setActiveWorkout((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        exercises: prev.exercises.map((group) => {
          if (group.exercise.id !== exerciseId) return group;
          const filtered = group.sets.filter((s) => s.id !== setId);
          return {
            ...group,
            sets: filtered.map((s, idx) => ({ ...s, order: idx + 1 })),
          };
        }),
      };
    });
  };

  const addExerciseToActiveWorkout = (exercise: Exercise) => {
    if (!activeWorkout) return;
    if (activeWorkout.exercises.some((e) => e.exercise.id === exercise.id)) return;
    setActiveWorkout((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        exercises: [
          ...prev.exercises,
          {
            exercise,
            sets: [
              {
                id: `set_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                exerciseId: exercise.id,
                exerciseName: exercise.name,
                order: 1,
                weight: 0,
                reps: 0,
                rpe: 8,
                isWarmup: false,
                isCompleted: false,
                timestamp: new Date().toISOString(),
              },
            ],
          },
        ],
      };
    });
  };

  const removeExerciseFromActiveWorkout = (exerciseId: string) => {
    if (!activeWorkout) return;
    setActiveWorkout((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        exercises: prev.exercises.filter((g) => g.exercise.id !== exerciseId),
      };
    });
  };

  const discardWorkout = () => {
    setActiveWorkout(null);
    localStorage.removeItem(ACTIVE_WORKOUT_KEY);
  };

  /**
   * FINISH WORKOUT:
   * 1. Collect all completed working sets (non-warmup)
   * 2. O(1) PR detection against running `personalBests` stored on exercise document
   * 3. Update exercise documents with new bests atomically
   * 4. Save session to Firestore
   * 5. Update user streak
   */
  const finishWorkout = async (): Promise<PRAchievement[]> => {
    if (!user || !activeWorkout) return [];

    const completedAt = new Date().toISOString();
    const durationSeconds = Math.max(
      60,
      Math.round((new Date(completedAt).getTime() - new Date(activeWorkout.startedAt).getTime()) / 1000)
    );

    const allLoggedSets: WorkoutSet[] = [];
    const prsDetected: PRAchievement[] = [];
    const exerciseBestsUpdates: Record<string, PersonalBests> = {};

    activeWorkout.exercises.forEach((group) => {
      const exDoc = exercises.find((e) => e.id === group.exercise.id) || group.exercise;
      let currentBests: PersonalBests = exerciseBestsUpdates[group.exercise.id] || {
        ...(exDoc.personalBests || {}),
      };

      group.sets.forEach((set) => {
        // Only evaluate completed sets
        if (!set.isCompleted && set.weight <= 0 && set.reps <= 0) return;

        const isCompleted = true;
        let isPR = false;

        // WARMUP SETS ARE STRICTLY EXCLUDED FROM PR DETECTION
        if (!set.isWarmup && set.weight > 0 && set.reps > 0) {
          const est1RM = calculateEstimated1RM(set.weight, set.reps);

          // 1. Check Heaviest Weight PR
          const prevBestWeight = currentBests.bestWeight?.value || 0;
          if (set.weight > prevBestWeight) {
            isPR = true;
            prsDetected.push({
              exerciseId: group.exercise.id,
              exerciseName: group.exercise.name,
              prType: 'weight',
              value: set.weight,
              previousValue: prevBestWeight,
              weight: set.weight,
              reps: set.reps,
            });
            currentBests = {
              ...currentBests,
              bestWeight: {
                value: set.weight,
                reps: set.reps,
                date: completedAt,
                sessionId: activeWorkout.sessionId,
              },
            };
          }

          // 2. Check Best Estimated 1RM PR
          const prevBest1RM = currentBests.bestEstimated1RM?.value || 0;
          if (est1RM > prevBest1RM) {
            isPR = true;
            prsDetected.push({
              exerciseId: group.exercise.id,
              exerciseName: group.exercise.name,
              prType: '1rm',
              value: est1RM,
              previousValue: prevBest1RM,
              weight: set.weight,
              reps: set.reps,
            });
            currentBests = {
              ...currentBests,
              bestEstimated1RM: {
                value: est1RM,
                weight: set.weight,
                reps: set.reps,
                date: completedAt,
                sessionId: activeWorkout.sessionId,
              },
            };
          }

          // 3. Check Best Reps at Given Weight
          const weightKey = String(Math.round(set.weight));
          const currentRepsAtWeight = (currentBests.bestRepsAtWeight || {})[weightKey] || 0;
          if (set.reps > currentRepsAtWeight) {
            isPR = true;
            prsDetected.push({
              exerciseId: group.exercise.id,
              exerciseName: group.exercise.name,
              prType: 'reps',
              value: set.reps,
              previousValue: currentRepsAtWeight,
              weight: set.weight,
              reps: set.reps,
            });
            currentBests = {
              ...currentBests,
              bestRepsAtWeight: {
                ...(currentBests.bestRepsAtWeight || {}),
                [weightKey]: set.reps,
              },
            };
          }
        }

        allLoggedSets.push({
          ...set,
          isCompleted,
          isPR,
        });
      });

      exerciseBestsUpdates[group.exercise.id] = currentBests;
    });

    const totalVolume = calculateVolume(allLoggedSets);
    const totalSets = allLoggedSets.filter((s) => s.isCompleted).length;

    const newSession: WorkoutSession = {
      id: activeWorkout.sessionId,
      splitId: activeWorkout.splitId,
      splitName: activeWorkout.splitName,
      dayId: activeWorkout.dayId,
      dayName: activeWorkout.dayName,
      startedAt: activeWorkout.startedAt,
      completedAt,
      durationSeconds,
      totalVolume,
      totalSets,
      prsAchieved: prsDetected,
      isCompleted: true,
      sets: allLoggedSets,
    };

    // Commit to Firestore: session doc and update exercises
    const batch = writeBatch(db);
    const sessionDocRef = doc(db, 'users', user.uid, 'sessions', newSession.id);
    batch.set(sessionDocRef, newSession);

    // Save each set to subcollection for fine-grained querying if needed
    allLoggedSets.forEach((set) => {
      const setDocRef = doc(db, 'users', user.uid, 'sessions', newSession.id, 'sets', set.id);
      batch.set(setDocRef, set);
    });

    // Update running personal bests on exercise documents
    Object.entries(exerciseBestsUpdates).forEach(([exId, bests]) => {
      const exDocRef = doc(db, 'users', user.uid, 'exercises', exId);
      batch.update(exDocRef, {
        personalBests: bests,
        updatedAt: completedAt,
      });
    });

    await batch.commit();

    // Streak calculation
    const todayStr = new Date().toISOString().split('T')[0];
    let newStreak = profile?.streak || 0;
    const lastWorkout = profile?.lastWorkoutDate ? profile.lastWorkoutDate.split('T')[0] : null;

    if (!lastWorkout) {
      newStreak = 1;
    } else if (lastWorkout === todayStr) {
      // Already logged today, streak unchanged
    } else {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastWorkout === yesterdayStr) {
        newStreak += 1;
      } else {
        newStreak = 1;
      }
    }

    await updateUserProfile({
      streak: newStreak,
      lastWorkoutDate: completedAt,
    });

    // Set PR state for celebration modal
    if (prsDetected.length > 0) {
      setLatestPRs(prsDetected);
    }

    // Reset active workout
    setActiveWorkout(null);
    localStorage.removeItem(ACTIVE_WORKOUT_KEY);

    return prsDetected;
  };

  // --- REFERENCE: "LAST TIME" QUERY ---
  const getLastPerformance = (exerciseId: string): WorkoutSet[] | null => {
    for (const session of sessions) {
      const matchingSets = (session.sets || []).filter(
        (s) => s.exerciseId === exerciseId && s.isCompleted && !s.isWarmup
      );
      if (matchingSets.length > 0) {
        return matchingSets;
      }
    }
    return null;
  };

  // --- PAST DATA EDITING & PR RECALIBRATION ---
  const updatePastSet = async (sessionId: string, updatedSet: WorkoutSet) => {
    if (!user) return;
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return;

    const newSets = session.sets.map((s) => (s.id === updatedSet.id ? updatedSet : s));
    const newVolume = calculateVolume(newSets);
    const sessionDocRef = doc(db, 'users', user.uid, 'sessions', sessionId);
    const setDocRef = doc(db, 'users', user.uid, 'sessions', sessionId, 'sets', updatedSet.id);

    const batch = writeBatch(db);
    batch.update(sessionDocRef, {
      sets: newSets,
      totalVolume: newVolume,
      totalSets: newSets.filter((s) => s.isCompleted).length,
    });
    batch.update(setDocRef, { ...updatedSet });
    await batch.commit();

    // Recalibrate PRs for this exercise
    await recalibrateExercisePRs(updatedSet.exerciseId);
  };

  const deletePastSet = async (sessionId: string, setId: string) => {
    if (!user) return;
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return;

    const setTarget = session.sets.find((s) => s.id === setId);
    const newSets = session.sets.filter((s) => s.id !== setId);
    const newVolume = calculateVolume(newSets);

    const sessionDocRef = doc(db, 'users', user.uid, 'sessions', sessionId);
    const setDocRef = doc(db, 'users', user.uid, 'sessions', sessionId, 'sets', setId);

    const batch = writeBatch(db);
    batch.update(sessionDocRef, {
      sets: newSets,
      totalVolume: newVolume,
      totalSets: newSets.filter((s) => s.isCompleted).length,
    });
    batch.delete(setDocRef);
    await batch.commit();

    if (setTarget) {
      await recalibrateExercisePRs(setTarget.exerciseId);
    }
  };

  const deletePastSession = async (sessionId: string) => {
    if (!user) return;
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return;

    const sessionDocRef = doc(db, 'users', user.uid, 'sessions', sessionId);
    await deleteDoc(sessionDocRef);

    // Recalibrate PRs for all exercises that were in this session
    const exerciseIds = Array.from(new Set((session.sets || []).map((s) => s.exerciseId)));
    for (const exId of exerciseIds) {
      await recalibrateExercisePRs(exId);
    }
  };

  /**
   * Recalibrate running personal bests for an exercise from remaining history.
   * Called only when past data is edited or deleted.
   */
  const recalibrateExercisePRs = async (exerciseId: string) => {
    if (!user) return;

    let bestWeightVal = 0;
    let bestWeightObj: PersonalBests['bestWeight'];
    let best1RMVal = 0;
    let best1RMObj: PersonalBests['bestEstimated1RM'];
    const repsAtWeight: Record<string, number> = {};

    // Scan all completed working sets for this exercise across all remaining sessions
    sessions.forEach((sess) => {
      (sess.sets || []).forEach((s) => {
        if (s.exerciseId === exerciseId && s.isCompleted && !s.isWarmup && s.weight > 0 && s.reps > 0) {
          // Weight
          if (s.weight > bestWeightVal) {
            bestWeightVal = s.weight;
            bestWeightObj = {
              value: s.weight,
              reps: s.reps,
              date: sess.completedAt || sess.startedAt,
              sessionId: sess.id,
            };
          }
          // 1RM
          const est1RM = calculateEstimated1RM(s.weight, s.reps);
          if (est1RM > best1RMVal) {
            best1RMVal = est1RM;
            best1RMObj = {
              value: est1RM,
              weight: s.weight,
              reps: s.reps,
              date: sess.completedAt || sess.startedAt,
              sessionId: sess.id,
            };
          }
          // Reps at weight
          const wKey = String(Math.round(s.weight));
          if (s.reps > (repsAtWeight[wKey] || 0)) {
            repsAtWeight[wKey] = s.reps;
          }
        }
      });
    });

    const newPersonalBests: PersonalBests = {
      bestWeight: bestWeightObj,
      bestEstimated1RM: best1RMObj,
      bestRepsAtWeight: repsAtWeight,
    };

    const exDocRef = doc(db, 'users', user.uid, 'exercises', exerciseId);
    try {
      await updateDoc(exDocRef, {
        personalBests: newPersonalBests,
        updatedAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Could not recalibrate exercise PRs (exercise may be deleted):', e);
    }
  };

  return (
    <WorkoutContext.Provider
      value={{
        splits,
        exercises,
        sessions,
        activeSplit,
        activeWorkout,
        loadingData,
        latestPRs,
        clearLatestPRs,
        createSplit,
        updateSplit,
        deleteSplit,
        setActiveSplit,
        createSplitFromTemplate,
        createExercise,
        updateExercise,
        deleteExercise,
        startWorkout,
        addSetToActive,
        updateActiveSet,
        removeActiveSet,
        addExerciseToActiveWorkout,
        removeExerciseFromActiveWorkout,
        finishWorkout,
        discardWorkout,
        updatePastSet,
        deletePastSet,
        deletePastSession,
        recalibrateExercisePRs,
        getLastPerformance,
      }}
    >
      {children}
    </WorkoutContext.Provider>
  );
};

export const useWorkout = (): WorkoutContextType => {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error('useWorkout must be used within a WorkoutProvider');
  }
  return context;
};
