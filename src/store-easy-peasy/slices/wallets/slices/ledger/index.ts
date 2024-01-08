import { connect } from "./thunks/connect";
import { signAndSendTx } from "~/store-easy-peasy/slices/wallets/slices/ledger/thunks/signAndSendTx/signAndSendTx";
import { config } from "~/config/config";

export const ledger = {
  // init state
  networkId: config.networkId,
  rpcUrl: config.urls.rpc,
  // thunks
  connect,
  signAndSendTx,
};
