import { requestConnect } from "./thunks/requestConnect";
import { completeConnection } from "./thunks/completeConnect";
import { signAndSendTx } from "~/store-easy-peasy/slices/wallets/slices/myNearWallet/thunks/signAndSendTx";
import { handleRedirects } from '~/store-easy-peasy/slices/wallets/slices/myNearWallet/thunks/handleRedirects';

export const myNearWallet = {
  // init state
  networkId: "mainnet",
  rpcUrl: "https://rpc.mainnet.near.org",
  walletUrl: "https://app.mynearwallet.com",
  loginUrl: "https://app.mynearwallet.com/login",
  // thunks
  requestConnect,
  completeConnection,
  signAndSendTx,
  handleRedirects,
};
