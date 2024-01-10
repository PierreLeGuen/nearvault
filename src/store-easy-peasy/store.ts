import { createStore } from "easy-peasy";
import { accounts } from "~/store-easy-peasy/slices/accounts";
import { wallets } from "./slices/wallets";
import { pages } from "src/store-easy-peasy/slices/pages";
import { multisig } from "src/store-easy-peasy/slices/contracts/multisig";
import type { Store } from '~/store-easy-peasy/types';

const model = {
  // nested slices
  accounts,
  pages,
  multisig,
  wallets,
};

export const store = createStore<Store>(model, { name: "Near-Finance" });
