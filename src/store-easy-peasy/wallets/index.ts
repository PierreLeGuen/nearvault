import { persist } from "easy-peasy";
import { myNearWallet } from "./myNearWallet/index.js";
import { ledger } from "./ledger/index.js";
import { setConnectionInProgress } from '~/store-easy-peasy/wallets/self/actions/setConnectionInProgress';
import { executeTransaction } from '~/store-easy-peasy/wallets/self/thunks/executeTransaction';

export const wallets = persist(
  {
    // init state
    connectInProgress: null,
    // actions
    setConnectionInProgress,
    // thunks
    executeTransaction,
    // nested slices
    myNearWallet,
    ledger,
  },
  { storage: "localStorage", allow: ["connectInProgress"] },
);
