import { Thunk } from "easy-peasy";
import { Store } from "~/store-easy-peasy/types";
import { Transaction } from "@near-js/transactions";

type State = {
  networkId: string;
  rpcUrl: string;
};

export type Connect = Thunk<Ledger, void, void, Store>;

export type SignAndSendTx = Thunk<
  Ledger,
  { transaction: Transaction },
  void,
  Store
>;

type Thunks = {
  connect: Connect;
  signAndSendTx: SignAndSendTx;
};

export type Ledger = State & Thunks;
