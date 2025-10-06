import { Config } from "~/config/config";
import { createKitWalletUrls } from "~/config/kitWallet";
import { createNearBlocksUrls } from "~/config/nearBlocks";
import { newFastNearApi } from "./fastnear";
import { newNearNearBlocksApiNew } from "./nearBlocksApiNew";
import { newPikeSpeakApi } from "./pikespeak";

export const testnet: Config = {
  networkId: "testnet",
  urls: {
    rpc: "https://rpc.testnet.near.org",
    nearBlocksApiUrl: "https://api3.nearblocks.io",
    myNearWalletUrl: "https://testnet.mynearwallet.com",
    kitWallet: createKitWalletUrls("https://testnet-api.kitwallet.app"),
    nearBlocksApiUI: createNearBlocksUrls("https://testnet.nearblocks.io"),
    nearBlocksApi: newNearNearBlocksApiNew("https://api3.nearblocks.io"),
    fastNearApi: newFastNearApi(),
    pikespeakApi: newPikeSpeakApi(),
  },
  accounts: {
    multisigFactory: "multisignature.testnet",
    lockupFactory: "dev-lockup.testnet",
    lockupFactoryFoundation: "dev-lockup-foundation.testnet",
  },
};
