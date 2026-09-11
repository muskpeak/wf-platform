import { create } from "zustand";

export type LottoTab = "current" | "mytickets" | "rules";

export interface BetItem {
  id: string;
  numbers: number[];
  multiplier: number;
}

interface WorldLottoState {
  activeTab: LottoTab;
  setActiveTab: (tab: LottoTab) => void;

  // Selected 7 digits for current picker (null means empty)
  selectedDigits: (number | null)[];
  focusedIndex: number;
  setFocusedIndex: (index: number) => void;
  setDigit: (index: number, digit: number | null) => void;
  randomizeDigits: () => void;
  clearDigits: () => void;

  // Multiplier for the staging ticket picker
  currentMultiplier: number;
  setCurrentMultiplier: (multiplier: number) => void;

  // Current Bets list
  bets: BetItem[];
  addCurrentBet: () => void;
  addRandomBets: (count: number) => void;
  updateBetMultiplier: (id: string, multiplier: number) => void;
  removeBet: (id: string) => void;
  clearBets: () => void;

  // Drawer
  isCartDrawerOpen: boolean;
  setCartDrawerOpen: (isOpen: boolean) => void;
}

export const useWorldLottoStore = create<WorldLottoState>((set, get) => ({
  activeTab: "current",
  setActiveTab: (tab) => set({ activeTab: tab }),

  selectedDigits: Array(7).fill(null),
  focusedIndex: 0,
  setFocusedIndex: (index) => set({ focusedIndex: index }),

  setDigit: (index, digit) => {
    const { selectedDigits } = get();
    const newDigits = [...selectedDigits];
    newDigits[index] = digit;
    // Auto advance to next slot if valid digit entered
    let nextIndex = index;
    if (digit !== null && index < 6) {
      nextIndex = index + 1;
    }
    set({ selectedDigits: newDigits, focusedIndex: nextIndex });
  },

  randomizeDigits: () => {
    set({
      selectedDigits: Array.from({ length: 7 }, () => Math.floor(Math.random() * 10)),
      focusedIndex: 6,
    });
  },

  clearDigits: () => {
    set({
      selectedDigits: Array(7).fill(null),
      focusedIndex: 0,
    });
  },

  currentMultiplier: 1,
  setCurrentMultiplier: (multiplier) =>
    set({ currentMultiplier: Math.min(10000, Math.max(1, isNaN(multiplier) ? 1 : multiplier)) }),

  bets: [],

  addCurrentBet: () => {
    const { selectedDigits, currentMultiplier, bets } = get();
    const completedNumbers = selectedDigits.map((d) =>
      d === null ? Math.floor(Math.random() * 10) : d
    );
    const newBet: BetItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
      numbers: completedNumbers,
      multiplier: currentMultiplier,
    };
    set({
      bets: [...bets, newBet],
      selectedDigits: Array(7).fill(null),
      focusedIndex: 0,
    });
  },

  addRandomBets: (count: number) => {
    const { currentMultiplier, bets } = get();
    const newBets: BetItem[] = Array.from({ length: count }, () => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
      numbers: Array.from({ length: 7 }, () => Math.floor(Math.random() * 10)),
      multiplier: currentMultiplier,
    }));
    set({ bets: [...bets, ...newBets] });
  },

  updateBetMultiplier: (id: string, multiplier: number) => {
    const clamped = Math.min(10000, Math.max(1, isNaN(multiplier) ? 1 : multiplier));
    set((state) => ({
      bets: state.bets.map((b) => (b.id === id ? { ...b, multiplier: clamped } : b)),
    }));
  },

  removeBet: (id) => {
    set((state) => ({ bets: state.bets.filter((b) => b.id !== id) }));
  },

  clearBets: () => set({ bets: [] }),

  isCartDrawerOpen: false,
  setCartDrawerOpen: (isOpen) => set({ isCartDrawerOpen: isOpen }),
}));
