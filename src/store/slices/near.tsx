import { connect, type Near } from "near-api-js";
import { type StateCreator } from "zustand";
import { config } from "~/config/config";

export interface NearState {
  // Won't change current NEAR connection if already exists
  newNearConnection: () => Promise<Near>;
}

export const createNearSlice: StateCreator<NearState> = () => ({
  newNearConnection: async () => {
    const nearConnection = await connect({
      networkId: config.networkId,
      nodeUrl: config.urls.rpc,
    });
    return nearConnection;
  },
});
