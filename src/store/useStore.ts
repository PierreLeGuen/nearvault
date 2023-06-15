import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";

import { type CounterState, createCounterSlice } from "./slices/counter";
import {
  type WalletState,
  createWalletSlice,
  type WalletActions,
} from "./slices/wallet";
import { type TeamsState, createTeamsSlice } from "./slices/teams";
import { type NearState, createNearSlice } from "./slices/near";

export type IStore = CounterState &
  (WalletState & WalletActions) &
  TeamsState &
  NearState;

const usePersistingStore = create<IStore>()(
  devtools(
    persist(
      (...a) => ({
        ...createCounterSlice(...a),
        ...createWalletSlice(...a),
        ...createTeamsSlice(...a),
        ...createNearSlice(...a),
      }),
      { name: "store" }
    )
  )
);

export default usePersistingStore;
