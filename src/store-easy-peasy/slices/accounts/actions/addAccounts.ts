import { action } from "easy-peasy";

export const addAccounts = action((slice: any, accounts) => {
  accounts.forEach((account: any) => {
    slice.map[account.accountId] = account;
  });

  slice.list = Object.keys(slice.map);
  slice.selected = accounts[0];
});
