import { type PublicKey } from "near-api-js/lib/utils";
import { type StateCreator } from "zustand";

export interface WalletState {
  publicKey: PublicKey | null;
  accountId: string | null;
}

export interface WalletActions {
  setPublicKey: (publicKey: PublicKey | null) => void;
  setAccountId: (accountId: string | null) => void;
  resetWallet: () => void;
}

const initialState: WalletState = {
  publicKey: null,
  accountId: null,
};

export const createWalletSlice: StateCreator<WalletState & WalletActions> = (
  set
) => ({
  ...initialState,
  setPublicKey: (publicKey) => set({ publicKey }),
  setAccountId: (accountId) => set({ accountId }),
  resetWallet: () => set(initialState),
});
