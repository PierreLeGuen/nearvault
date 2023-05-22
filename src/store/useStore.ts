import { create } from "zustand";
import { type CounterState, createCounterSlice } from "./slices/counter";
import { type WalletState, createWalletSlice } from "./slices/wallet";
import { persist, devtools } from "zustand/middleware";
import { type TeamsState, createTeamsSlice } from "./slices/teams";

export type IStore = CounterState & WalletState & TeamsState;

const usePersistingStore = create<IStore>()(
  devtools(
    persist(
      (...a) => ({
        ...createCounterSlice(...a),
        ...createWalletSlice(...a),
        ...createTeamsSlice(...a),
      }),
      { name: "store" }
    )
  )
);

export default usePersistingStore;
