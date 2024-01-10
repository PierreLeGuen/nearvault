import { myNearWallet } from "./slices/myNearWallet";
import { ledger } from "./slices/ledger";
import { modal } from "~/store-easy-peasy/slices/wallets/slices/modal";
import { signAndSendTransaction } from "~/store-easy-peasy/slices/wallets/thunks/signAndSendTransaction/signAndSendTransaction";
import type { Wallets } from '~/store-easy-peasy/slices/wallets/types';

export const wallets: Wallets = {
  // thunks
  signAndSendTransaction,
  // nested slices
  modal,
  myNearWallet,
  ledger,
};

