import { createStore, persist, action } from "easy-peasy";
import { wallets } from "./wallets/index.js";
import { walletsConnector } from "./walletsConnector/index.js";
import { initApp } from "./thunks/initApp.js";
import { addRequestAndConfirm } from "./thunks/addRequestAndConfirm.js";

const model = persist(
  {
    selectedAccount: null,
    accounts: [],

    selectAccount: action((state, payload) => {
      state.selectedAccount = state.accounts.find(
        (account) => account.accountId === payload,
      );
    }),
    addAccount: action((state, { accounts }) => {
      const anotherKeysAccounts = state.accounts.filter(
        (a) => a.publicKey !== accounts[0].publicKey,
      );
      // const autoAddedAccounts = accounts.filter((a) => a.accountId !== account.accountId);
      state.accounts = [...anotherKeysAccounts, ...accounts];
      state.selectedAccount = accounts[0];
    }),

    // isWalletModalOpen: false,
    // openWalletModal: action((state) => {
    //   state.isWalletModalOpen = true;
    // }),
    // closeWalletModal: action((state) => {
    //   state.isWalletModalOpen = false;
    // }),
    wallets,
    walletsConnector,
    // thunks
    initApp,
    addRequestAndConfirm,
  },
  { storage: "localStorage", allow: ["accounts", "selectedAccount"] },
);

export const store = createStore(model, { name: "Near-Finance" });
