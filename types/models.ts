// Kaarma Data Models — TypeScript equivalents of Kotlin domain models
// Based on requirements.md Section 8

// ─── Enums ──────────────────────────────────────────────────────────────────

export enum HabitCategory {
  HEALTH = 'HEALTH',
  MIND = 'MIND',
  WORK = 'WORK',
  PERSONAL = 'PERSONAL',
  CUSTOM = 'CUSTOM',
}

export enum HabitFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  X_PER_WEEK = 'X_PER_WEEK',
  EVERY_N_DAYS = 'EVERY_N_DAYS',
}

export enum BadHabitCategory {
  SUBSTANCE = 'SUBSTANCE',
  DIGITAL = 'DIGITAL',
  BEHAVIORAL = 'BEHAVIORAL',
  CUSTOM = 'CUSTOM',
}

export enum BadHabitSeverity {
  MILD = 'MILD',
  MODERATE = 'MODERATE',
  SEVERE = 'SEVERE',
}

export enum UrgeEventType {
  RESISTED = 'RESISTED',
  RELAPSE = 'RELAPSE',
}

export enum ActivityCategory {
  EXERCISE = 'EXERCISE',
  WORK = 'WORK',
  LEARNING = 'LEARNING',
  SOCIAL = 'SOCIAL',
  REST = 'REST',
  CHORES = 'CHORES',
  CREATIVE = 'CREATIVE',
  CUSTOM = 'CUSTOM',
}

export enum ActivityIntensity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum GoalCategory {
  FITNESS = 'FITNESS',
  LEARNING = 'LEARNING',
  CAREER = 'CAREER',
  FINANCE = 'FINANCE',
  RELATIONSHIP = 'RELATIONSHIP',
  PERSONAL = 'PERSONAL',
}

export enum GoalType {
  QUANTITATIVE = 'QUANTITATIVE',
  MILESTONE = 'MILESTONE',
  YES_NO = 'YES_NO',
}

export enum GoalStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  ABANDONED = 'ABANDONED',
}

export enum Intention {
  BUILD_HABITS = 'BUILD_HABITS',
  BREAK_HABITS = 'BREAK_HABITS',
  JOURNALING = 'JOURNALING',
  SCREEN_TIME = 'SCREEN_TIME',
  GOALS = 'GOALS',
}

// ─── Habit ──────────────────────────────────────────────────────────────────

export interface Habit {
  id: string;                                // UUID
  userId: string;
  name: string;
  emoji: string;
  colorHex: string;
  category: HabitCategory;
  frequency: HabitFrequency;
  weekDays: number[];                        // 0=Mon..6=Sun
  timesPerWeek: number;
  everyNDays: number;
  reminderTime: string | null;               // "HH:mm" format
  createdAt: string;                         // ISO timestamp
  isArchived: boolean;
  streakShieldsRemaining: number;            // premium only, default 0
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  completedDate: string;                     // ISO date "YYYY-MM-DD"
  completedAt: string;                       // ISO timestamp
}

// ─── Bad Habit ──────────────────────────────────────────────────────────────

export interface BadHabit {
  id: string;
  userId: string;
  name: string;
  category: BadHabitCategory;
  severity: BadHabitSeverity;
  quitDate: string;                          // ISO date
  notes: string | null;
  createdAt: string;                         // ISO timestamp
}

export interface UrgeEvent {
  id: string;
  badHabitId: string;
  type: UrgeEventType;                       // RESISTED | RELAPSE
  note: string | null;
  triggerTag: string | null;
  resetCounter: boolean;                     // only relevant if type=RELAPSE
  loggedAt: string;                          // ISO timestamp
}

// ─── Journal ────────────────────────────────────────────────────────────────

export interface JournalEntry {
  id: string;
  userId: string;
  date: string;                              // ISO date
  moodScore: number;                         // 1-5
  contentJson: string;                       // Rich text as JSON
  tags: string[];
  photoUris: string[];                       // premium, local URIs
  createdAt: string;                         // ISO timestamp
  updatedAt: string;                         // ISO timestamp
}

// ─── Activity ───────────────────────────────────────────────────────────────

export interface ActivityLog {
  id: string;
  userId: string;
  name: string;
  category: ActivityCategory;
  durationMinutes: number;
  date: string;                              // ISO date
  time: string;                              // "HH:mm"
  intensity: ActivityIntensity;
  notes: string | null;
  loggedAt: string;                          // ISO timestamp
}

// ─── Goal ───────────────────────────────────────────────────────────────────

export interface Milestone {
  id: string;
  title: string;
  isCompleted: boolean;
  completedAt: string | null;                // ISO timestamp
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  category: GoalCategory;
  goalType: GoalType;
  targetValue: number | null;
  currentValue: number;
  unit: string | null;
  milestones: Milestone[];
  targetDate: string | null;                 // ISO date, null = open-ended
  linkedHabitIds: string[];
  status: GoalStatus;
  createdAt: string;                         // ISO timestamp
  completedAt: string | null;                // ISO timestamp
}

// ─── Screen Time ────────────────────────────────────────────────────────────

export interface AppLimit {
  packageName: string;                       // Android package / iOS bundle ID
  appName: string;
  dailyLimitMs: number;
  hardBlock: boolean;                        // premium only
  isEnabled: boolean;
}

export interface AppUsageSummary {
  packageName: string;
  appName: string;
  totalTimeMs: number;
  pickupCount: number;
  lastUsed: string;                          // ISO timestamp
  dailyLimitMs?: number;
}

export interface FocusSession {
  id: string;
  blockedPackages: string[];
  durationMs: number;
  startedAt: string;                         // ISO timestamp
  endedAt: string | null;                    // ISO timestamp
  endedEarly: boolean;
}

export interface BlockingSchedule {
  id: string;
  name: string;
  blockedPackages: string[];
  startTime: string;                         // "HH:mm"
  endTime: string;                           // "HH:mm"
  repeatDays: number[];                      // 0=Mon..6=Sun
  isEnabled: boolean;
}

// ─── User ───────────────────────────────────────────────────────────────────

export interface UserProfile {
  displayName: string;
  email: string;
  avatar: string | null;                     // URI
  bio: string;
  onboardingCompleted: boolean;
  selectedIntentions: Intention[];
}

// ─── Social (premium) ───────────────────────────────────────────────────────

export interface SocialShareData {
  userId: string;
  displayName: string;
  avatar: string | null;
  habitName: string;
  streakCount: number;
  completionDate: string;                    // ISO date
}
