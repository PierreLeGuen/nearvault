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
  newNearConnection: async () => {
    const nearConnection = await connect(get().config);
    set({ nearConnection });
    return nearConnection;
  },
});
