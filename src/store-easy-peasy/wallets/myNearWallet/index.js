import { setConnection } from "./actions/setConnection.js";
import { createConnection } from "./thunks/createConnection.js";
import { requestConnect } from "./thunks/requestConnect.js";
import { completeConnection } from "./thunks/completeConnect.js";
import { signAndSendTx } from '~/store-easy-peasy/wallets/myNearWallet/thunks/signAndSendTx';

export const myNearWallet = {
  // init state
  networkId: "mainnet",
  rpcUrl: "https://rpc.mainnet.near.org",
  walletUrl: "https://app.mynearwallet.com",
  connection: null,
  // actions
  setConnection,
  // thunks
  createConnection,
  requestConnect,
  completeConnection,
  signAndSendTx,
};
