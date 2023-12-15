import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";

import {
  type WalletState,
  createWalletSlice,
  type WalletActions,
} from "./slices/wallet";
import { type TeamsState, createTeamsSlice } from "./slices/teams";
import { type NearState, createNearSlice } from "./slices/near";

export type IStore = (WalletState & WalletActions) & TeamsState & NearState;

const usePersistingStore = create<IStore>()(
  devtools(
    persist(
      (...a) => ({
        ...createWalletSlice(...a),
        ...createTeamsSlice(...a),
        ...createNearSlice(...a),
      }),
      { name: "store" },
    ),
  ),
);

export default usePersistingStore;
