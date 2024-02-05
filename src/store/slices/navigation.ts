import { StateCreator } from "zustand";
import { WsState } from "./wallet-selector";

export enum ModalState {
  Home,
  LedgerDerivationPath,
  LedgerSharePublicKey,
  LedgerSharePublicKeySuccess,
  LedgerSignTransaction,
  LedgerError,
  WaitForTransaction,
}

export interface NavState {
  isModalOpen: boolean;
  modalState: ModalState;
  ledgerError: string;
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
  goToLedgerError: (error) => void;
  goToLedgerSignTransaction: (error?: string) => void;
  goToWaitForTransaction: (transactionId?: string) => void;
}

export const createWalletNavigation: StateCreator<
  NavState & NavActions & WsState,
  [],
  [],
  NavState & NavActions
> = (set, get) => ({
  isModalOpen: false,
  modalState: ModalState.Home,
  ledgerError: "",
  sharedPk: "",
  discoveredAccounts: [],
  transactionId: "",
  openModal: () => {
    set({ isModalOpen: true });
  },
  closeModal: () => {
    set({ isModalOpen: false });
  },
  goHome: () => {
    set({ modalState: ModalState.Home });
  },
  goToLedgerDerivationPath: (error?: string) => {
    set({ ledgerError: error, modalState: ModalState.LedgerDerivationPath });
  },
  goToLedgerSharePublicKey: () => {
    set({ modalState: ModalState.LedgerSharePublicKey });
  },
  goToLedgerError: (error) => {
    set({ ledgerError: error, modalState: ModalState.LedgerError });
  },
  goToLedgerSharePublicKeySuccess: (key: string) => {
    const discoveredAccounts = get().accounts[key];
    set({
      sharedPk: key,
      discoveredAccounts: discoveredAccounts.filter(Boolean),
      modalState: ModalState.LedgerSharePublicKeySuccess,
    });
  },
  goToLedgerSignTransaction: (error?: string) => {
    set({
      isModalOpen: true,
      modalState: ModalState.LedgerSignTransaction,
      ledgerError: error,
    });
  },
  goToWaitForTransaction: (transactionId?: string) => {
    set({
      modalState: ModalState.WaitForTransaction,
      transactionId: transactionId,
    });
  },
});
