import { Config } from "./config";
import { createKitWalletUrls } from "~/config/kitWallet";
import { createNearBlocksUrls } from "~/config/nearBlocks";

export const mainnet: Config = {
  networkId: "mainnet",
  urls: {
    rpc: "https://rpc.mainnet.near.org",
    myNearWallet: "https://app.mynearwallet.com",
    kitWallet: createKitWalletUrls("https://api.kitwallet.app"),
    nearBlocks: createNearBlocksUrls("https://nearblocks.io"),
  },
  accounts: {
    multisigFactory: "multisignature.near",
    lockupFactory: "lockup.near",
    lockupFactoryFoundation: "foundation.near",
  },
};
