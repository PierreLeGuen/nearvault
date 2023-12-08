import { action } from "easy-peasy";

export const selectAccount = action((state: any, payload: any) => {
  state.selectedAccount = state.accounts.find((account: any) => account.accountId === payload);
});
