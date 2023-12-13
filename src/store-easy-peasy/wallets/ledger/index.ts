import { connect } from "./thunks/connect";

export const ledger = {
  // init state
  networkId: "mainnet",
  rpcUrl: "https://rpc.mainnet.near.org",
  indexerUrl: 'https://api.kitwallet.app',
  // thunks
  connect,
};
