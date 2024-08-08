import { type Config } from "./config";
import { createKitWalletUrls } from "~/config/kitWallet";
import { createNearBlocksUrls } from "~/config/nearBlocks";
import { createNearBlocksApiUrls } from "./nearBlocksApi";
import { newNearNearBlocksApiNew, baseUrl } from "./nearBlocksApiNew";
import { newFastNearApi } from "./fastnear";
import { newPikeSpeakApi } from "./pikespeak";

export const mainnet: Config = {
  networkId: "mainnet",
  urls: {
    rpc: "https://rpc.mainnet.near.org",
    myNearWallet: "https://app.mynearwallet.com",
    kitWallet: createKitWalletUrls("https://api.kitwallet.app"),
    nearBlocks: createNearBlocksUrls("https://nearblocks.io"),
    nearBlocksApi: createNearBlocksApiUrls("https://api.nearblocks.io/v1"),
    nearBlocksApiNew: newNearNearBlocksApiNew(baseUrl),
    fastNearApi: newFastNearApi(),
    pikespeakApi: newPikeSpeakApi(),
  },
  accounts: {
    multisigFactory: "multisignature.near",
    lockupFactory: "lockup.near",
    lockupFactoryFoundation: "foundation.near",
  },
};
