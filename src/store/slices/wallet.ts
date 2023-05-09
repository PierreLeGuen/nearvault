import { type PublicKey } from "near-api-js/lib/utils";
import { type StateCreator } from "zustand";

export interface WalletState {
  publicKey: PublicKey | null;
  setPublicKey: (publicKey: PublicKey) => void;
}

export const createWalletSlice: StateCreator<WalletState> = (set, get) => ({
  publicKey: null,
  setPublicKey: (publicKey) => set({ publicKey }),
});
