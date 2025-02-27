import { connect, type Near } from "near-api-js";
import { type StateCreator } from "zustand";
import { config } from "~/config/config";

export interface NearState {
  rpcUrl: string;
  setRpcUrl: (rpcUrl: string) => void;
  newNearConnection: () => Promise<Near>;
}

export const createNearSlice: StateCreator<NearState> = (set, get) => ({
  rpcUrl: config.urls.rpc,
  setRpcUrl: (rpcUrl: string) => {
    set({ rpcUrl });
  },
  newNearConnection: async () => {
    const rpcUrl = get().rpcUrl;
    const nearConnection = await connect({
      networkId: config.networkId,
      nodeUrl: rpcUrl,
    });
    return nearConnection;
  },
});
