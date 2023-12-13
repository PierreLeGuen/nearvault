import { connect } from "./thunks/connect";
import { signAndSendTx } from '~/store-easy-peasy/wallets/ledger/thunks/signAndSendTx';

export const ledger = {
  // init state
  networkId: "mainnet",
  rpcUrl: "https://rpc.mainnet.near.org",
  indexerUrl: 'https://api.kitwallet.app',
  // thunks
  connect,
  signAndSendTx,
};
