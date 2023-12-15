import { persist } from "easy-peasy";
import { myNearWallet } from "./slices/myNearWallet";
import { ledger } from "./slices/ledger";
import { modal } from '~/store-easy-peasy/slices/wallets/slices/modal';
import { setConnectInProgress } from "~/store-easy-peasy/slices/wallets/actions/setConnectInProgress";
import { signAndSendTransaction } from "~/store-easy-peasy/slices/wallets/thunks/signAndSendTransaction/signAndSendTransaction";

const model = {
  // init state
  connectInProgress: null,
  // actions
  setConnectInProgress,
  // thunks
  signAndSendTransaction,
  // nested slices
  modal,
  myNearWallet,
  ledger,
};

export const wallets = persist(model, {
  storage: "localStorage",
  allow: ["connectInProgress"],
});
