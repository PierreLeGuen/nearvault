import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";

import { type NearState, createNearSlice } from "./slices/near";

export type IStore = NearState;

const usePersistingStore = create<IStore>()(
  devtools(
    persist(
      (...a) => ({
        ...createNearSlice(...a),
      }),
      { name: "store" },
    ),
  ),
);

export default usePersistingStore;
