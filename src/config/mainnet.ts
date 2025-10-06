import { createKitWalletUrls } from "~/config/kitWallet";
import { createNearBlocksUrls } from "~/config/nearBlocks";
import { type Config } from "./config";
import { newFastNearApi } from "./fastnear";
import { baseUrl, newNearNearBlocksApiNew } from "./nearBlocksApiNew";
import { newPikeSpeakApi } from "./pikespeak";

export const mainnet: Config = {
  networkId: "mainnet",
  urls: {
    rpc: "https://free.rpc.fastnear.com/",
    nearBlocksApiUrl: baseUrl,
    myNearWalletUrl: "https://app.mynearwallet.com",
    kitWallet: createKitWalletUrls("https://api.kitwallet.app"),
    nearBlocksApiUI: createNearBlocksUrls("https://nearblocks.io"),
    nearBlocksApi: newNearNearBlocksApiNew(baseUrl),
    fastNearApi: newFastNearApi(),
    pikespeakApi: newPikeSpeakApi(),
  },
  accounts: {
    multisigFactory: "multisignature.near",
    lockupFactory: "lockup.near",
    lockupFactoryFoundation: "foundation.near",
  },
};
