import { connect, type Near } from "near-api-js";
import { type StateCreator } from "zustand";

export interface NearState {
  config: {
    networkId: "mainnet" | "testnet";
    nodeUrl: string;
  };
  nearConnection: Near | undefined;
  switchNetwork: () => Promise<void>;
  // Wont change current NEAR connection if already exists
  assertNearConnection: () => Promise<Near>;
  newNearConnection: () => Promise<Near>;
}

export const createNearSlice: StateCreator<NearState> = (set, get) => ({
  config: {
    networkId: "mainnet",
    nodeUrl: "https://beta.rpc.mainnet.near.org",
  },
  nearConnection: undefined,
  switchNetwork: async () => {
    if (get().config.networkId === "mainnet") {
      set({
        config: {
          networkId: "testnet",
          nodeUrl: "https://rpc.testnet.near.org",
        },
      });
    } else {
      set({
        config: {
          networkId: "mainnet",
          nodeUrl: "https://beta.rpc.mainnet.near.org",
        },
      });
    }
    await get().newNearConnection();
  },
  assertNearConnection: async () => {
    const b = get().nearConnection;
    if (b !== undefined) {
      return b;
    }

    await get().newNearConnection();
    const c = get().nearConnection;
    if (c === undefined) {
      throw new Error("Failed to create NEAR connection");
    }
    return c;
  },
  newNearConnection: async () => {
    const nearConnection = await connect(get().config);
    set({ nearConnection });
    return nearConnection;
  },
});
