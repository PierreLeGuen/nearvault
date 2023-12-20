import { requestConnect } from "./thunks/requestConnect";
import { completeConnection } from "./thunks/completeConnect";
import { signAndSendTx } from "~/store-easy-peasy/slices/wallets/slices/myNearWallet/thunks/signAndSendTx";

export const myNearWallet = {
  // init state
  networkId: "mainnet",
  rpcUrl: "http://beta.rpc.mainnet.near.org",
  walletUrl: "https://app.mynearwallet.com",
  loginUrl: "https://app.mynearwallet.com/login",
  // thunks
  requestConnect,
  completeConnection,
  signAndSendTx,
};
