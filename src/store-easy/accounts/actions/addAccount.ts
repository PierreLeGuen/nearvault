import { action } from "easy-peasy";

export const addAccount = action((state: any, { accounts }) => {
  const anotherKeysAccounts = state.accounts.filter(
    (a: any) => a.publicKey !== accounts[0].publicKey,
  );

  state.accounts = [...anotherKeysAccounts, ...accounts];
  state.selectedAccount = accounts[0];
});
