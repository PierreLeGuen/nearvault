import { Thunk, Action } from "easy-peasy";
import { myNearWallet } from "./slices/myNearWallet";
import { ledger } from "./slices/ledger";
import { modal } from "~/store-easy-peasy/slices/wallets/slices/modal";
import { signAndSendTransaction } from "~/store-easy-peasy/slices/wallets/thunks/signAndSendTransaction/signAndSendTransaction";

export type Wallets = {
  signAndSendTransaction: Thunk<{}, any, any, {}, Promise<void>>;
  modal: {
    isOpen: boolean;
    route: string;
    routeParams: any;
    open: Action<{}, any>;
    close: Action<{}, any>;
    navigate: Action<any>;
  };
  myNearWallet: {};
  ledger: {};
};


export const wallets: Wallets = {
  // thunks
  signAndSendTransaction,
  // nested slices
  modal,
  myNearWallet,
  ledger,
};

