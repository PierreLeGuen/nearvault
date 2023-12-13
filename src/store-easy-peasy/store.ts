import { createStore, persist, action, thunk } from "easy-peasy";
import { wallets } from "./slices/wallets";
import { walletsConnector } from "~/store-easy-peasy/slices/walletsConnector/index.js";
import { pages } from "src/store-easy-peasy/slices/pages";
import { multisig } from 'src/store-easy-peasy/slices/multisig';
import { initApp } from "~/store-easy-peasy/thunks/initApp.js";

const model = persist(
  {
    // TODO Move it to accounts
    selectedAccount: null,
    accounts: [], // TODO migrate to list+map structure

    selectAccount: action((slice: any, accountId) => {
      if (slice.selectedAccount.accountId === accountId) return;
      slice.selectedAccount = slice.accounts.find(
        (account: any) => account.accountId === accountId,
      );
    }),

    addAccount: action((slice: any, { accounts }) => {
      const anotherKeysAccounts = slice.accounts.filter(
        (account: any) => account.publicKey !== accounts[0].publicKey,
      );
      slice.accounts = [...anotherKeysAccounts, ...accounts];
      slice.selectedAccount = accounts[0];
    }),

    isAccountConnected: thunk((_, accountId, { getState }) => {
      const slice: any = getState();
      return slice.accounts.some(
        (account: any) => account.accountId === accountId,
      );
    }),

    // thunks
    initApp, // TODO remove it
    // nested slices
    pages,
    multisig,
    wallets,
    walletsConnector,
  },
  { storage: "localStorage", allow: ["accounts", "selectedAccount"] },
);

export const store = createStore(model, { name: "Near-Finance" });
