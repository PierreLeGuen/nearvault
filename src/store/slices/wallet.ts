import { type PublicKey } from "near-api-js/lib/utils";
import { type StateCreator } from "zustand";

export interface WalletState {
  publicKey: PublicKey | null;
  accountId: string | null;
  setPublicKey: (publicKey: PublicKey) => void;
  setAccountId: (accountId: string) => void;
}

export const createWalletSlice: StateCreator<WalletState> = (set, get) => ({
  publicKey: null,
  accountId: null,
  setPublicKey: (publicKey) => set({ publicKey }),
  setAccountId: (accountId) => set({ accountId }),
});
