import { type StateCreator } from "zustand";

export interface CounterState {
  count: number;
  increase: (by: number) => void;
}

export const createCounterSlice: StateCreator<CounterState> = (set, get) => ({
  count: 0,
  increase: () => set((state) => ({ count: state.count + 1 })),
  decrease: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
});
