import { connect, type Near } from "near-api-js";
import { type StateCreator } from "zustand";
import { config } from "~/config/config";
import { NearBlocksApi } from "~/config/nearBlocksApiNew";
import { RpcClient } from "~/lib/client";

export interface NearState {
  rpcUrl: string;
  nearblocksApiUrl: string;
  nearBlocksApiKey: string | null;
  setRpcUrl: (rpcUrl: string) => void;
  setNearBlocksApiUrl: (nearblocksApiUrl: string) => void;
  setNearBlocksApiKey: (apiKey: string | null) => void;
  newNearConnection: () => Promise<Near>;
  getProvider: () => RpcClient;
  getNearBlocksApi: () => NearBlocksApi;
}

export const createNearSlice: StateCreator<NearState> = (set, get) => ({
  rpcUrl: config.urls.rpc,
  nearblocksApiUrl: config.urls.nearBlocksApiUrl,
  nearBlocksApiKey: null,
  setRpcUrl: (rpcUrl: string) => {
    set({ rpcUrl });
  },
  setNearBlocksApiUrl(nearblocksApiUrl) {
    set({ nearblocksApiUrl });
  },
  setNearBlocksApiKey: (apiKey: string | null) => {
    set({ nearBlocksApiKey: apiKey });
  },
  newNearConnection: async () => {
    const rpcUrl = get().rpcUrl;
    const nearConnection = await connect({
      networkId: config.networkId,
      nodeUrl: rpcUrl,
    });
    return nearConnection;
  },
  getProvider: () => {
    return RpcClient.getInstance(get().rpcUrl);
  },
  getNearBlocksApi: () => {
    return NearBlocksApi.getInstance(
      get().nearblocksApiUrl,
      get().nearBlocksApiKey,
    );
  },
});
