import { create } from "zustand";
import { BetItem } from "../../world/store/useWorldLottoStore";

export type Lotto3DTab = "current" | "mytickets" | "rules";

interface ThreeDLottoState {
  activeTab: Lotto3DTab;
  setActiveTab: (tab: Lotto3DTab) => void;

  // 3-digit picker
  selectedDigits: (number | null)[];
  focusedIndex: number;
  setFocusedIndex: (index: number) => void;
  setDigit: (index: number, digit: number | null) => void;
  randomizeDigits: () => void;
  clearDigits: () => void;

  currentMultiplier: number;
  setCurrentMultiplier: (multiplier: number) => void;

  bets: BetItem[];
  addCurrentBet: () => void;
  addRandomBets: (count: number) => void;
  updateBetMultiplier: (id: string, multiplier: number) => void;
  removeBet: (id: string) => void;
  clearBets: () => void;

  isCartDrawerOpen: boolean;
  setCartDrawerOpen: (isOpen: boolean) => void;
}

export const use3DLottoStore = create<ThreeDLottoState>((set, get) => ({
  activeTab: "current",
  setActiveTab: (tab) => set({ activeTab: tab }),

  selectedDigits: [null, null, null],
  focusedIndex: 0,
  setFocusedIndex: (index) => set({ focusedIndex: index }),

  setDigit: (index, digit) => {
    const { selectedDigits } = get();
    const newDigits = [...selectedDigits];
    newDigits[index] = digit;
    let nextIndex = index;
    if (digit !== null && index < 2) {
      nextIndex = index + 1;
    }
    set({ selectedDigits: newDigits, focusedIndex: nextIndex });
  },

  randomizeDigits: () => {
    set({
      selectedDigits: Array.from({ length: 3 }, () => Math.floor(Math.random() * 10)),
      focusedIndex: 2,
    });
  },

  clearDigits: () => {
    set({ selectedDigits: Array(3).fill(null), focusedIndex: 0 });
  },

  currentMultiplier: 2,
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
    set({ bets: [...bets, newBet], selectedDigits: Array(3).fill(null), focusedIndex: 0 });
  },

  addRandomBets: (count: number) => {
    const { currentMultiplier, bets } = get();
    const newBets: BetItem[] = Array.from({ length: count }, () => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
      numbers: Array.from({ length: 3 }, () => Math.floor(Math.random() * 10)),
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
