import { mainnet } from "~/config/mainnet";
import { testnet } from "~/config/testnet";
import type { KitWalletUrls } from "~/config/kitWallet";
import { type NearBlocksUrls } from "~/config/nearBlocks";
import { type NearBlocksApiUrls } from "./nearBlocksApi";
import { type NearBlocksApiNewType } from "./nearBlocksApiNew";
import { type FastNearApiType } from "./fastnear";
import { type PikeSpeakApiType } from "./pikespeak";

export type Config = {
  networkId: "mainnet" | "testnet";
  urls: {
    rpc: string;
    myNearWallet: string;
    kitWallet: KitWalletUrls;
    nearBlocks: NearBlocksUrls;
    nearBlocksApi: NearBlocksApiUrls;
    nearBlocksApiNew: NearBlocksApiNewType;
    fastNearApi: FastNearApiType;
    pikespeakApi: PikeSpeakApiType;
  };
  accounts: {
    multisigFactory: string;
    lockupFactory: string;
    lockupFactoryFoundation: string;
  };
};

export const getConfig = () => {
  if (typeof window !== "undefined") {
    const domain = window.location.hostname;
    return domain.includes("testnet") ? testnet : mainnet;
  }
  return process.env.NEXT_PUBLIC_NETWORK_ID === "mainnet" ? mainnet : testnet; // default to mainnet if window is not defined (e.g., server-side rendering)
};

export const config: Config = getConfig();
