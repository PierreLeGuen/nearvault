import { myNearWallet } from "./slices/myNearWallet";
import { ledger } from "./slices/ledger";
import { modal } from "~/store-easy-peasy/slices/wallets/slices/modal";
import { signAndSendTransaction } from "~/store-easy-peasy/slices/wallets/thunks/signAndSendTransaction/signAndSendTransaction";

export const wallets = {
  // thunks
  signAndSendTransaction,
  // nested slices
  modal,
  myNearWallet,
  ledger,
};
