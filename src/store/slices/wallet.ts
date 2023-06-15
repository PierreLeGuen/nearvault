import { type PublicKey } from "near-api-js/lib/utils";
import { type StateCreator } from "zustand";

export interface WalletState {
  publicKey: PublicKey | null;
  accountId: string | null;
}

export interface WalletActions {
  setPublicKey: (publicKey: PublicKey) => void;
  setAccountId: (accountId: string) => void;
  resetWallet: () => void;
}

const initialState: WalletState = {
  publicKey: null,
  accountId: null,
};

export const createWalletSlice: StateCreator<WalletState & WalletActions> = (
  set,
  get
) => ({
  ...initialState,
  setPublicKey: (publicKey) => set({ publicKey }),
  setAccountId: (accountId) => set({ accountId }),
  resetWallet: () => set(initialState),
});
