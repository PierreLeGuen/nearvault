import { Thunk } from "easy-peasy";
import type { Store } from "~/store-easy-peasy/types";
import type { Modal } from "~/store-easy-peasy/slices/wallets/slices/modal/types";
import type { Ledger } from "~/store-easy-peasy/slices/wallets/slices/ledger/types";
import { MyNearWallet } from "./slices/myNearWallet/types";

type SignAndSendTransactionPayload = {
  senderId: string;
  receiverId: string;
  action: object;
  actions: object[];
};

export type SignAndSendTransaction = Thunk<
  Wallets,
  SignAndSendTransactionPayload,
  void,
  Store
>;

type Thunks = {
  signAndSendTransaction: SignAndSendTransaction;
};

type Slices = {
  modal: Modal;
  myNearWallet: MyNearWallet;
  ledger: Ledger;
};

export type Wallets = Thunks & Slices;
