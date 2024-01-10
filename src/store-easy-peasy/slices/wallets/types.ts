import { Thunk } from "easy-peasy";
import type { Store } from "~/store-easy-peasy/types";
import type { Modal } from '~/store-easy-peasy/slices/wallets/slices/modal/types';

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
  myNearWallet: {};
  ledger: {};
};

export type Wallets = Thunks & Slices;
