import { Config } from "~/config/config";
import { createKitWalletUrls } from "~/config/kitWallet";
import { createNearBlocksUrls } from "~/config/nearBlocks";
import { createNearBlocksApiUrls } from "~/config/nearBlocksApi";
import { newNearNearBlocksApiNew } from "./nearBlocksApiNew";
import { newFastNearApi } from "./fastnear";

export const testnet: Config = {
  networkId: "testnet",
  urls: {
    rpc: "https://rpc.testnet.near.org",
    // rpc: "http://beta.rpc.testnet.near.org",
    myNearWallet: "https://testnet.mynearwallet.com",
    kitWallet: createKitWalletUrls("https://testnet-api.kitwallet.app"),
    nearBlocks: createNearBlocksUrls("https://testnet.nearblocks.io"),
    nearBlocksApi: createNearBlocksApiUrls(
      "https://api-testnet.nearblocks.io/v1",
    ),
    nearBlocksApiNew: newNearNearBlocksApiNew("https://api3.nearblocks.io"),
    fastNearApi: newFastNearApi(),
  },
  accounts: {
    multisigFactory: "multisignature.testnet",
    lockupFactory: "dev-lockup.testnet",
    lockupFactoryFoundation: "dev-lockup-foundation.testnet",
  },
};
