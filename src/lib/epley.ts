/**
 * Epley formula for estimating One-Rep Max (1RM):
 * 1RM = Weight * (1 + Reps / 30)
 * Note: for 1 rep, 1RM equals the weight lifted.
 */
export function calculateEstimated1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return Math.round(weight * 10) / 10;
  const raw1RM = weight * (1 + reps / 30);
  return Math.round(raw1RM * 10) / 10;
}

/**
 * Calculates total volume for a list of sets.
 * Warmup sets are strictly excluded from total volume.
 */
export function calculateVolume(sets: { weight: number; reps: number; isWarmup: boolean; isCompleted?: boolean }[]): number {
  return sets.reduce((acc, set) => {
    if (set.isWarmup) return acc;
    if (set.isCompleted === false) return acc;
    return acc + Math.max(0, set.weight) * Math.max(0, set.reps);
  }, 0);
}
