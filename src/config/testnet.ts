import { Config } from "~/config/config";
import { createKitWalletUrls } from "~/config/kitWallet";
import { createNearBlocksUrls } from "~/config/nearBlocks";

export const testnet: Config = {
  networkId: "testnet",
  urls: {
    rpc: "https://rpc.testnet.near.org",
    myNearWallet: "https://testnet.mynearwallet.com",
    kitWallet: createKitWalletUrls("https://testnet-api.kitwallet.app"),
    nearBlocks: createNearBlocksUrls("https://testnet.nearblocks.io"),
  },
  accounts: {
    multisigFactory: "multisignature.testnet",
    lockupFactory: "dev-lockup.testnet",
    lockupFactoryFoundation: "dev-lockup-foundation.testnet",
  },
};
