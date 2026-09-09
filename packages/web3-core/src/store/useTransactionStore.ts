"use client";

import { create } from 'zustand';

export type TransactionStatus = 'pending' | 'success' | 'failed';

export interface Transaction {
  hash: string;
  description: string;
  status: TransactionStatus;
  timestamp: number;
}

interface TransactionStore {
  transactions: Record<string, Transaction>;
  addTransaction: (tx: Transaction) => void;
  updateTransaction: (hash: string, updates: Partial<Transaction>) => void;
  removeTransaction: (hash: string) => void;
  clearTransactions: () => void;
  getPendingTransactions: () => Transaction[];
}

export const useTransactionStore = create<TransactionStore>((set, get) => ({
  transactions: {},
  
  addTransaction: (tx) =>
    set((state) => ({
      transactions: {
        ...state.transactions,
        [tx.hash]: tx,
      },
    })),

  updateTransaction: (hash, updates) =>
    set((state) => {
      const tx = state.transactions[hash];
      if (!tx) return state;
      return {
        transactions: {
          ...state.transactions,
          [hash]: { ...tx, ...updates },
        },
      };
    }),

  removeTransaction: (hash) =>
    set((state) => {
      const { [hash]: removed, ...rest } = state.transactions;
      return { transactions: rest };
    }),

  clearTransactions: () => set({ transactions: {} }),

  getPendingTransactions: () => {
    return Object.values(get().transactions).filter((tx) => tx.status === 'pending');
  },
}));
