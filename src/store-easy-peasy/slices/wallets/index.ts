import { persist } from "easy-peasy";
import { myNearWallet } from "./slices/myNearWallet";
import { ledger } from "./slices/ledger";
import { setConnectionInProgress } from "~/store-easy-peasy/slices/wallets/actions/setConnectionInProgress";
import { signAndSendTransaction } from "~/store-easy-peasy/slices/wallets/thunks/signAndSendTransaction/signAndSendTransaction";

const model = {
  // init state
  connectInProgress: null,
  // actions
  setConnectionInProgress,
  // thunks
  signAndSendTransaction,
  // nested slices
  myNearWallet,
  ledger,
};

export const wallets = persist(model, {
  storage: "localStorage",
  allow: ["connectInProgress"],
});
