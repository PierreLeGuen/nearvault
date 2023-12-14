import { createStore } from "easy-peasy";
import { accounts } from '~/store-easy-peasy/slices/accounts';
import { wallets } from "./slices/wallets";
import { walletsConnector } from "~/store-easy-peasy/slices/walletsConnector/index.js";
import { pages } from "src/store-easy-peasy/slices/pages";
import { multisig } from "src/store-easy-peasy/slices/multisig";
import { initApp } from "~/store-easy-peasy/thunks/initApp.js";

const model = {
  // thunks
  initApp, // TODO remove it
  // nested slices
  accounts,
  pages,
  multisig,
  wallets,
  walletsConnector,
};

export const store = createStore(model, { name: "Near-Finance" });
