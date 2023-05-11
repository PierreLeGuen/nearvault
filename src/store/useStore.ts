import { create } from "zustand";
import { type CounterState, createCounterSlice } from "./slices/counter";
import { type WalletState, createWalletSlice } from "./slices/wallet";
import { persist, devtools } from "zustand/middleware";

export type IStore = CounterState & WalletState;

const usePersistingStore = create<IStore>()(
  devtools(
    persist(
      (...a) => ({
        ...createCounterSlice(...a),
        ...createWalletSlice(...a),
      }),
      { name: "store" }
    )
  )
);

export default usePersistingStore;
