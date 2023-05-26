import { connect, keyStores, type Near } from "near-api-js";
import { type StateCreator } from "zustand";

export interface NearState {
  config: {
    networkId: "mainnet" | "testnet";
    keyStore: keyStores.BrowserLocalStorageKeyStore;
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
    keyStore: {},
    nodeUrl: "https://rpc.mainnet.near.org",
  },
  nearConnection: undefined,
  switchNetwork: async () => {
    if (get().config.networkId === "mainnet") {
      set({
        config: {
          networkId: "testnet",
          keyStore: new keyStores.BrowserLocalStorageKeyStore(),
          nodeUrl: "https://rpc.testnet.near.org",
        },
      });
    } else {
      set({
        config: {
          networkId: "mainnet",
          keyStore: new keyStores.BrowserLocalStorageKeyStore(),
          nodeUrl: "https://rpc.mainnet.near.org",
        },
      });
    }
    await get().newNearConnection();
  },
  assertNearConnection: async () => {
    console.log(get());

    if (get().nearConnection !== undefined) {
      return get().nearConnection;
    }
    await get().newNearConnection();
    return get().nearConnection;
  },
  newNearConnection: async () => {
    const nearConnection = await connect(get().config);
    set({ nearConnection });
    return nearConnection;
  },
});
