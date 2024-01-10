import * as process from "process";
import { mainnet } from "~/config/mainnet";
import { testnet } from "~/config/testnet";
import type { KitWalletUrls } from "~/config/kitWallet";
import { NearBlocksUrls } from "~/config/nearBlocks";
import { NearBlocksApiUrls } from "./nearBlocksApi";

export type Config = {
  networkId: "mainnet" | "testnet";
  urls: {
    rpc: string;
    myNearWallet: string;
    kitWallet: KitWalletUrls;
    nearBlocks: NearBlocksUrls;
    nearBlocksApi: NearBlocksApiUrls;
  };
  accounts: {
    multisigFactory: string;
    lockupFactory: string;
    lockupFactoryFoundation: string;
  };
};

const getConfig = () =>
  process.env.NEXT_PUBLIC_NETWORK_ID === "mainnet" ? mainnet : testnet;

export const config: Config = getConfig();
