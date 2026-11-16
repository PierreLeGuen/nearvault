import { type StateCreator } from "zustand";
import { config } from "~/config/config";
import { NearBlocksApi } from "~/config/nearBlocksApiNew";
import { RpcClient } from "~/lib/client";
import { NearConnection } from "~/lib/near/compat";

export interface NearState {
  rpcUrl: string;
  nearblocksApiUrl: string;
  nearBlocksApiKey: string | null;
  setRpcUrl: (rpcUrl: string) => void;
  setNearBlocksApiUrl: (nearblocksApiUrl: string) => void;
  setNearBlocksApiKey: (apiKey: string | null) => void;
  newNearConnection: () => Promise<NearConnection>;
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
  newNearConnection: () => {
    const rpcUrl = get().rpcUrl;
    const nearConnection = new NearConnection({
      networkId: config.networkId,
      nodeUrl: rpcUrl,
    });
    return Promise.resolve(nearConnection);
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
