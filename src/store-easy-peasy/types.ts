import { Accounts } from '~/store-easy-peasy/slices/accounts/types';
import { Wallets } from '~/store-easy-peasy/slices/wallets/types';

export type AccountId = string;

export type Store = {
  accounts: Accounts,
  pages: any,
  multisig: any,
  wallets: Wallets,
}