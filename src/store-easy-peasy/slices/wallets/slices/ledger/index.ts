import { connect } from "./thunks/connect";
import { signAndSendTx } from "~/store-easy-peasy/slices/wallets/slices/ledger/thunks/signAndSendTx/signAndSendTx";

export const ledger = {
  // init state
  networkId: "mainnet",
  rpcUrl: "http://beta.rpc.mainnet.near.org",
  indexerUrl: "https://api.kitwallet.app",
  // thunks
  connect,
  signAndSendTx,
};
