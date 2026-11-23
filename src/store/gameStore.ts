import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type LevelId = 'talk' | 'garden' | 'school' | 'toys' | 'house' | 'volley'
export const LEVEL_ORDER: LevelId[] = ['talk', 'garden', 'school', 'toys', 'house', 'volley']

export type Skill = 'vocabulary' | 'listening' | 'speaking' | 'grammar'
/** first = right on the first try, hint = right after one miss (a hint is shown), retry = 2+ misses */
export type Outcome = 'first' | 'hint' | 'retry' | 'revealed'

export interface Attempt {
  t: number
  level: LevelId
  activity: string
  skill: Skill
  topic: string
  item: string
  outcome: Outcome
  misses: number
}

export type SpeechResult = 'correct' | 'partial' | 'other-answer' | 'unclear' | 'error' | 'manual'
export interface SpeechAttempt {
  t: number
  level: LevelId
  item: string
  result: SpeechResult
  heard?: string
}

export interface Settings {
  assist: boolean
  voiceRate: number
  voiceVol: number
  musicVol: number
  sfxVol: number
  musicOn: boolean
  reducedMotion: boolean
  /** A grown-up allowed the browser speech recogniser (it may send audio to the browser vendor). */
  micEnabled: boolean
}

export type Screen =
  | { name: 'welcome' }
  | { name: 'menu' }
  | { name: 'map' }
  | { name: 'level'; level: LevelId }
  | { name: 'rewards' }
  | { name: 'settings'; back: Screen['name'] }
  | { name: 'teacher' }

interface GameState {
  playerName: string | null
  settings: Settings
  completed: Partial<Record<LevelId, boolean>>
  activityIndex: Partial<Record<LevelId, number>>
  rewards: LevelId[]
  attempts: Attempt[]
  speech: SpeechAttempt[]
  review: Record<string, number>
  timeSpentMs: number
  lastPlayed: number | null
  teacherPin: string
  /** Alya's own decoration: item -> [x, y] in stage pixels, per orientation */
  decor: { l: Record<string, [number, number]>; p: Record<string, [number, number]> }
  // transient
  screen: Screen
  // actions
  setName: (n: string) => void
  go: (s: Screen) => void
  setSettings: (p: Partial<Settings>) => void
  setActivityIndex: (l: LevelId, i: number) => void
  completeLevel: (l: LevelId) => void
  recordAttempt: (a: Omit<Attempt, 't'>) => void
  recordSpeech: (a: Omit<SpeechAttempt, 't'>) => void
  addTime: (ms: number) => void
  setPin: (p: string) => void
  setDecor: (o: 'l' | 'p', id: string, pos: [number, number] | null) => void
  resetProgress: () => void
}

const defaultSettings: Settings = {
  assist: true,
  voiceRate: 0.95,
  voiceVol: 1,
  musicVol: 0.35,
  sfxVol: 0.7,
  musicOn: true,
  reducedMotion: false,
  micEnabled: false,
}

/** localStorage can throw (private mode, blocked storage) – never let that break the game. */
const safeStorage = createJSONStorage(() => ({
  getItem: (k: string) => {
    try {
      return localStorage.getItem(k)
    } catch {
      return null
    }
  },
  setItem: (k: string, v: string) => {
    try {
      localStorage.setItem(k, v)
    } catch {
      /* ignore */
    }
  },
  removeItem: (k: string) => {
    try {
      localStorage.removeItem(k)
    } catch {
      /* ignore */
    }
  },
}))

export const useGame = create<GameState>()(
  persist(
    (set) => ({
      playerName: null,
      settings: defaultSettings,
      completed: {},
      activityIndex: {},
      rewards: [],
      attempts: [],
      speech: [],
      review: {},
      timeSpentMs: 0,
      lastPlayed: null,
      teacherPin: '1234',
      decor: { l: {}, p: {} },
      screen: { name: 'welcome' },

      setName: (n) => set({ playerName: n.trim().slice(0, 20) || 'Alya' }),
      go: (screen) => set({ screen }),
      setSettings: (p) => set((s) => ({ settings: { ...s.settings, ...p } })),
      setActivityIndex: (l, i) => set((s) => ({ activityIndex: { ...s.activityIndex, [l]: i } })),
      completeLevel: (l) =>
        set((s) => ({
          completed: { ...s.completed, [l]: true },
          rewards: s.rewards.includes(l) ? s.rewards : [...s.rewards, l],
          activityIndex: { ...s.activityIndex, [l]: 0 },
        })),
      recordAttempt: (a) =>
        set((s) => {
          const key = `${a.topic}:${a.item}`
          const review = { ...s.review }
          if (a.outcome === 'first') {
            if (review[key]) review[key] = Math.max(0, review[key] - 1)
            if (!review[key]) delete review[key]
          } else review[key] = (review[key] ?? 0) + 1
          return {
            attempts: [...s.attempts, { ...a, t: Date.now() }].slice(-4000),
            review,
            lastPlayed: Date.now(),
          }
        }),
      recordSpeech: (a) =>
        set((s) => ({ speech: [...s.speech, { ...a, t: Date.now() }].slice(-2000), lastPlayed: Date.now() })),
      addTime: (ms) => set((s) => ({ timeSpentMs: s.timeSpentMs + ms, lastPlayed: Date.now() })),
      setPin: (p) => set({ teacherPin: p }),
      setDecor: (o, id, pos) =>
        set((s) => {
          const d = { ...s.decor[o] }
          if (pos) d[id] = pos
          else delete d[id]
          return { decor: { ...s.decor, [o]: d } }
        }),
      resetProgress: () =>
        set({ completed: {}, activityIndex: {}, rewards: [], attempts: [], speech: [], review: {}, timeSpentMs: 0, lastPlayed: null }),
    }),
    {
      name: 'dream-house-v1',
      storage: safeStorage,
      partialize: (s) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { screen, ...rest } = s
        return rest
      },
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<GameState>
        return { ...current, ...p, settings: { ...defaultSettings, ...(p.settings ?? {}) } }
      },
    },
  ),
)

/** All levels are open: the teacher decides the order in the lesson. */

export function isUnlocked(_level: LevelId, _completed: Partial<Record<LevelId, boolean>>) {
  return true
}

/** Items the student missed recently, most-missed first: e.g. ["toy:kite", "grammar:isnt"]. */
export function reviewKeys(review: Record<string, number>) {
  return Object.entries(review)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k)
}
