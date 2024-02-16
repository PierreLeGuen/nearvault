import { type StateCreator } from "zustand";
import { type WsState } from "./wallet-selector";

export enum ModalState {
  Home,
  LedgerDerivationPath,
  LedgerSharePublicKey,
  SharePublicKeySuccess,
  LedgerSignTransaction,
  WaitForTransaction,
  PrivateKeyShare,
  FailedTransaction,
}

export interface NavState {
  isModalOpen: boolean;
  modalState: ModalState;
  error: string;
  sharedPk: string;
  discoveredAccounts: string[];
  transactionId: string;
}

export interface NavActions {
  openModal: () => void;
  closeModal: () => void;
  goHome: () => void;
  goToLedgerDerivationPath: (error?: string) => void;
  goToLedgerSharePublicKey: () => void;
  goToLedgerSharePublicKeySuccess: (key: string) => void;
  goToLedgerSignTransaction: (error?: string) => void;
  goToWaitForTransaction: (transactionId?: string) => void;
  goToPrivateKeyShare: (error?: string) => void;
  goToPrivateKeyConnectSuccess: (key: string, accounts: string[]) => void;
  goToFailedToSendTransaction: (error: string) => void;
}

export const createWalletNavigation: StateCreator<
  NavState & NavActions & WsState,
  [],
  [],
  NavState & NavActions
> = (set, get) => ({
  isModalOpen: false,
  modalState: ModalState.Home,
  error: "",
  sharedPk: "",
  discoveredAccounts: [],
  transactionId: "",
  openModal: () => {
    set({ isModalOpen: true, modalState: ModalState.Home });
  },
  closeModal: () => {
    set({ isModalOpen: false });
  },
  goHome: () => {
    set({ modalState: ModalState.Home });
  },
  goToLedgerDerivationPath: (error?: string) => {
    set({ error: error, modalState: ModalState.LedgerDerivationPath });
  },
  goToLedgerSharePublicKey: () => {
    set({ modalState: ModalState.LedgerSharePublicKey });
  },
  goToLedgerSharePublicKeySuccess: (key: string) => {
    const discoveredAccounts = get().keysToAccounts[key];
    set({
      sharedPk: key,
      discoveredAccounts: discoveredAccounts.filter(Boolean),
      modalState: ModalState.SharePublicKeySuccess,
    });
  },
  goToLedgerSignTransaction: (error?: string) => {
    set({
      isModalOpen: true,
      modalState: ModalState.LedgerSignTransaction,
      error: error,
    });
  },
  goToWaitForTransaction: (transactionId?: string) => {
    set({
      isModalOpen: true,
      modalState: ModalState.WaitForTransaction,
      transactionId: transactionId,
    });
  },
  goToPrivateKeyShare: (error?: string) => {
    set({ modalState: ModalState.PrivateKeyShare, error: error });
  },
  goToPrivateKeyConnectSuccess: (key: string, accounts: string[]) => {
    set({
      sharedPk: key,
      discoveredAccounts: accounts.filter(Boolean),
      modalState: ModalState.SharePublicKeySuccess,
    });
  },
  goToFailedToSendTransaction: (error: string) => {
    set({
      isModalOpen: true,
      modalState: ModalState.LedgerSignTransaction,
      error: error,
    });
  },
});
