import { createStore, persist, action, thunk } from "easy-peasy";
import { wallets } from "./wallets";
import { walletsConnector } from "./walletsConnector/index.js";
import { pages } from "~/store-easy-peasy/pages";
import { multisig } from '~/store-easy-peasy/multisig';
import { initApp } from "~/store-easy-peasy/self/thunks/initApp.js";
import { addRequestAndConfirm } from "~/store-easy-peasy/self/thunks/addRequestAndConfirm.js";

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
    addRequestAndConfirm, // TODO remove it
    // nested slices
    pages,
    multisig,
    wallets,
    walletsConnector,
  },
  { storage: "localStorage", allow: ["accounts", "selectedAccount"] },
);

export const store = createStore(model, { name: "Near-Finance" });
