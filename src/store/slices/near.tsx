import { connect, type Near } from "near-api-js";
import { type StateCreator } from "zustand";
import { config } from '~/config/config';

export interface NearState {
  config: {
    networkId: "mainnet" | "testnet";
    nodeUrl: string;
  };
  nearConnection: Near | undefined;
  // Won't change current NEAR connection if already exists
  newNearConnection: () => Promise<Near>;
}

export const createNearSlice: StateCreator<NearState> = (set, get) => ({
  config: {
    networkId: config.networkId,
    nodeUrl: config.urls.rpc,
  },
  nearConnection: undefined,
  newNearConnection: async () => {
    const nearConnection = await connect(get().config);
    set({ nearConnection });
    return nearConnection;
  },
});
