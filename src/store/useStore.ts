import { create } from "zustand";
import { type CounterState, createCounterSlice } from "./slices/counter";
import { type WalletState, createWalletSlice } from "./slices/wallet";

const useStore = create<CounterState & WalletState>()((...a) => ({
  ...createCounterSlice(...a),
  ...createWalletSlice(...a),
}));

export default useStore;
