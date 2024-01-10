import { action } from "easy-peasy";
import type { AddAccounts } from "~/store-easy-peasy/slices/accounts/types";

export const addAccounts: AddAccounts = action((slice, accounts) => {
  accounts.forEach((account) => {
    slice.map[account.accountId] = account;
  });

  slice.list = Object.keys(slice.map);
  slice.selected = accounts[0];
});
