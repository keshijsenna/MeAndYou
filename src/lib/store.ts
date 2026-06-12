import { create } from 'zustand';

export interface BucketItem {
  id: string;
  title: string;
  completed: boolean;
}

export interface GameState {
  triviaScore: number;
  memoryMatchTime: number;
  catchButtonCount: number;
  meteorScore: number;
  puzzleMoves: number;
  petHappiness: number;
  bucketListItems: BucketItem[];
  likeCounters: Record<number, number>;
  sliderValue: number;
}

export interface AppState {
  currentSection: number;
  unlockedSections: number[];
  gameState: GameState;
  audioState: {
    muted: boolean;
    musicPlaying: boolean;
    volume: number;
  };
  profileData: {
    daysTogether: number;
    nextAnniversary: Date;
    nauraNextBirthday: Date;
    farsyaNextBirthday: Date;
  };
  profileActiveTab: string;
  setProfileActiveTab: (tab: string) => void;
  goToSection: (n: number) => void;
  goToNext: () => void;
  unlockSection: (n: number) => void;
  setGameState: (partial: Partial<GameState>) => void;
  toggleMute: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentSection: 1,
  unlockedSections: [1],
  gameState: {
    triviaScore: 0,
    memoryMatchTime: 0,
    catchButtonCount: 0,
    meteorScore: 0,
    puzzleMoves: 0,
    petHappiness: 100,
    bucketListItems: [],
    likeCounters: {},
    sliderValue: 0,
  },
  audioState: {
    muted: false,
    musicPlaying: false,
    volume: 0.25,
  },
  profileData: {
    daysTogether: 0,
    nextAnniversary: new Date('2026-04-24T00:00:00'),
    nauraNextBirthday: new Date('2026-03-16T00:00:00'),
    farsyaNextBirthday: new Date('2026-01-17T00:00:00'),
  },
  profileActiveTab: 'hero',
  setProfileActiveTab: (tab) => set({ profileActiveTab: tab }),
  goToSection: (n) =>
    set((state) => ({
      currentSection: state.unlockedSections.includes(n) ? n : state.currentSection,
    })),
  goToNext: () =>
    set((state) => {
      const next = state.currentSection + 1;
      const newUnlocked = state.unlockedSections.includes(next)
        ? state.unlockedSections
        : [...state.unlockedSections, next];
      return { currentSection: next, unlockedSections: newUnlocked };
    }),
  unlockSection: (n) =>
    set((state) => ({
      unlockedSections: state.unlockedSections.includes(n)
        ? state.unlockedSections
        : [...state.unlockedSections, n],
    })),
  setGameState: (partial) =>
    set((state) => ({ gameState: { ...state.gameState, ...partial } })),
  toggleMute: () =>
    set((state) => ({
      audioState: { ...state.audioState, muted: !state.audioState.muted },
    })),
}));
