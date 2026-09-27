# Revised Implementation Plan: FORM — Personal Workout Logging & Progress Tracking

**FORM** is an end-to-end, minimal, monochrome fitness web application engineered with an Apple-esque design language, real-time Firebase backend (Auth + Firestore), intelligent PR detection, offline resilience, and full data history management.

---

## 1. Key Architectural Incorporations & Refinements

1. **$O(1)$ PR Detection Efficiency**:
   - Each `users/{userId}/exercises/{exerciseId}` document maintains a running `personalBests` map:
     ```typescript
     personalBests?: {
       bestWeight: { value: number; reps: number; date: string; sessionId: string };
       bestEstimated1RM: { value: number; weight: number; reps: number; date: string; sessionId: string };
       bestRepsAtWeight: { [weight: number]: number }; // weight (normalized) -> max reps
     }
     ```
   - On "Finish Workout", incoming working sets are evaluated only against the exercise's current stored bests. If a record is broken, the exercise document is atomically updated and flagged as a PR in the session. Full history scans are avoided during normal logging.

2. **Dedicated Warmup Set UI & Calculation Isolation**:
   - Every set row in the Active Workout Logger has an explicit toggle button (`W` / Warmup badge).
   - Warmup sets are visually distinguished (dimmed text, `W` pill badge, subtle dashed border).
   - Warmup sets are **strictly excluded** from:
     - Total workout volume calculations ($\sum \text{weight} \times \text{reps}$).
     - PR detection (heaviest weight, max reps, estimated 1RM).

3. **Offline Resilience & Firestore Persistent Cache**:
   - Firestore initialized with `initializeFirestore` using `persistentLocalCache` and `persistentMultipleTabManager` (IndexedDB persistent cache).
   - If connectivity drops mid-session, all writes, sets, and workout completions are queued locally and automatically sync upon reconnection.
   - A minimalist, non-intrusive banner or status dot ("Offline — changes will sync when connected") appears only when offline, clearing immediately once back online (`window.addEventListener('online'/'offline')`).

4. **Past Data Editing, Deleting, and PR Recalibration**:
   - In the History screen, tapping past sessions opens an expandable view with edit/delete controls for individual sets as well as full sessions.
   - Users can correct weight, reps, or RPE, or remove erroneously logged sets.
   - **PR Recalibration**: If an edited or deleted set held a stored personal best for an exercise, a background recalculation scans that specific exercise's remaining sets to reset the accurate personal best on the exercise document.

5. **Non-Destructive Deletion of Splits & Exercises**:
   - Past sessions and sets snapshot `exerciseName`, `exerciseCategory`, `splitName`, and `dayName` at the time of recording.
   - If a user deletes an exercise or split from their routine builder, historical workout sessions and sets remain completely intact. The UI safely handles deleted parents by falling back to the snapshotted name with a subtle "(Archived)" or "(Removed)" tag, preventing crashes or missing data.

---

## 2. Visual Design & Theme System

- **Monochrome Palette**:
  - Dark mode: `#0A0A0A` (background), `#141414` (surface), `#262626` (borders), `#E5E5E5` / `#A3A3A3` (text).
  - Light mode: `#FAFAFA` (background), `#FFFFFF` (surface), `#E5E5E5` (borders), `#0A0A0A` / `#737373` (text).
  - Single Accent: `#E8321C` (Precision Red) — strictly reserved for PR highlights, active streaks, and milestone achievements.
- **Typography**:
  - Clean system sans-serif for labels, titles, and body.
  - Monospace (`ui-monospace, SFMono-Regular, Menlo, monospace`) for all numbers: weights, reps, RPE, timers, and timestamps.
- **Dividers & Layout**:
  - Thin 1px clean borders instead of drop shadows or bulky cards.
  - Native-feeling mobile-first bottom tab bar (`Today`, `Splits`, `Exercises`, `History`, `Analytics`, `Settings`).

---

## 3. Data Model & Firestore Schema

All user data is isolated under `/users/{userId}`:

- `users/{userId}` (document):
  - `email`, `displayName`, `weightUnit`: `'lbs' | 'kg'`, `soundEnabled`: `boolean`, `vibrationEnabled`: `boolean`, `defaultRestDuration`: `number`, `activeSplitId`: `string | null`, `streak`: `number`, `lastWorkoutDate`: `string`.
- `users/{userId}/splits/{splitId}`:
  - `name`: string, `isActive`: boolean, `createdAt`: timestamp, `updatedAt`: timestamp.
- `users/{userId}/splits/{splitId}/days/{dayId}`:
  - `name`: string, `order`: number, `exerciseIds`: string[].
- `users/{userId}/exercises/{exerciseId}`:
  - `name`: string, `category`: `'barbell' | 'dumbbell' | 'machine' | 'bodyweight' | 'cable' | 'cardio'`, `isCustom`: boolean, `notes`: string, `personalBests`: object.
- `users/{userId}/sessions/{sessionId}`:
  - `splitId`: string, `splitName`: string, `dayId`: string, `dayName`: string, `startedAt`: timestamp, `completedAt`: timestamp, `durationSeconds`: number, `totalVolume`: number, `totalSets`: number, `prsAchieved`: array, `isCompleted`: boolean.
- `users/{userId}/sessions/{sessionId}/sets/{setId}`:
  - `exerciseId`: string, `exerciseName`: string, `order`: number, `weight`: number, `reps`: number, `rpe`: number, `isWarmup`: boolean, `isPR`: boolean, `timestamp`: timestamp.

---

## 4. Screens & User Flows

1. **Authentication & Guided First Split**:
   - Email/password and Google Sign-In.
   - First-time modal: Choose from verified templates (Push/Pull/Legs, Upper/Lower, Bro Split, Full Body) or build custom.
2. **Today / Home**:
   - Current split display, next scheduled day, one-tap "Start Workout", streak counter in `#E8321C`.
3. **Split Builder**:
   - Add/rename/reorder days and assign exercises. Multiple splits supported with one "Active".
4. **Exercise Library**:
   - Built-in library (40+ standard movements across Barbell, Dumbbell, Machine, Cable, Bodyweight) + Custom Exercise creator.
5. **Active Workout Logger**:
   - Blank inputs (no accidental autofill).
   - "Last time" reference chip: tap to reveal previous workout weights/reps in a popover sheet.
   - Dedicated Warmup (`W`) toggle per set.
   - Auto-starting rest timer (default 90s, +/-15s/30s/60s controls) with Web Audio chime + haptic vibration.
   - On completion: evaluates against stored exercise bests, flags PRs, shows celebration modal, saves session.
6. **History & Past Data Editor**:
   - Chronological list of workouts with total volume and PR badges.
   - Tap any session to expand full set logs.
   - Inline edit modal / delete set / delete session actions with automatic PR recalibration.
7. **Analytics & Progress (Recharts)**:
   - PR Dashboard: Heaviest weight, best reps, best estimated 1RM ($W \times (1 + R/30)$).
   - Charts: Weight progression over time, estimated 1RM curve, volume per workout.
8. **Settings & Data Export**:
   - Lbs/Kg unit toggle, audio chime toggle, vibration toggle, default rest timer selection.
   - **Export CSV**: flat log of all sets with timestamps, exercise, weight, reps, RPE.
   - **Export JSON**: complete backup of profile, splits, exercises, sessions, and sets.

---

## 5. Execution Steps

1. **Firebase Provisioning**:
   - Trigger `set_up_firebase` with `userConfirmedTermsAcceptedInUI: false` as required by the Firebase skill workflow.
   - Upon confirmation, provision Firestore and Authentication.
2. **Install Dependencies**:
   - `firebase`, `react-router-dom`, `recharts`, `canvas-confetti`, `@types/canvas-confetti`.
3. **Firebase Blueprint & Security Rules**:
   - Create `firebase-blueprint.json` and deploy hardened `firestore.rules`.
4. **Codebase Implementation**:
   - Implement Firebase client with IndexedDB persistent local cache.
   - Implement Auth, Exercise, Split, and Workout stores with real-time listeners.
   - Build UI components with Tailwind CSS following the monochrome design guidelines.
5. **Build, Test, and Verify**:
   - Run `compile_applet` and verify no compilation or lint errors.
