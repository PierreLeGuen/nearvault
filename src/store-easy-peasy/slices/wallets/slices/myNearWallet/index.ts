import { requestConnect } from "./thunks/requestConnect";
import { completeConnection } from "./thunks/completeConnect";
import { signAndSendTx } from "~/store-easy-peasy/slices/wallets/slices/myNearWallet/thunks/signAndSendTx";
import { handleRedirects } from '~/store-easy-peasy/slices/wallets/slices/myNearWallet/thunks/handleRedirects';
import { config } from '~/config/config';

export const myNearWallet = {
  // init state
  networkId: config.networkId,
  rpcUrl: config.urls.rpc,
  walletUrl: config.urls.myNearWallet,
  loginUrl: `${config.urls.myNearWallet}/login`,
  signUrl: `${config.urls.myNearWallet}/sign`,
  // thunks
  requestConnect,
  completeConnection,
  signAndSendTx,
  handleRedirects,
};
