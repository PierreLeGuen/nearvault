import type { Action, Thunk } from "easy-peasy";
import type { AccountId } from "~/store-easy-peasy/types";
import type { Store } from '~/store-easy-peasy/types';

export type Account = {
  accountId: AccountId;
  publicKey: string;
  wallet: string;
};

export type State = {
  selected: Account;
  list: AccountId[];
  map: Record<AccountId, Account>;
};

export type SelectAccount = Action<Accounts, AccountId>;
export type AddAccounts = Action<Accounts, Account[]>;

type Actions = {
  selectAccount: SelectAccount;
  addAccounts: AddAccounts;
};

export type CanSignTx = Thunk<Accounts, AccountId, void, Store, boolean>;

type Thunks = {
  canSignTx: CanSignTx;
};

export type Accounts = State & Actions & Thunks;
