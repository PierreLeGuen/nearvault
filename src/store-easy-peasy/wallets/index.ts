import { persist } from "easy-peasy";
import { myNearWallet } from "./myNearWallet";
import { ledger } from "./ledger";
import { setConnectionInProgress } from '~/store-easy-peasy/wallets/self/actions/setConnectionInProgress';
import { signAndSendTransaction } from '~/store-easy-peasy/wallets/self/thunks/signAndSendTransaction/signAndSendTransaction';

export const wallets = persist(
  {
    // init state
    connectInProgress: null,
    // actions
    setConnectionInProgress,
    // thunks
    signAndSendTransaction,
    // nested slices
    myNearWallet,
    ledger,
  },
  { storage: "localStorage", allow: ["connectInProgress"] },
);
