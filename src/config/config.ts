import type { KitWalletUrls } from "~/config/kitWallet";
import { mainnet } from "~/config/mainnet";
import { type NearBlocksUrls } from "~/config/nearBlocks";
import { testnet } from "~/config/testnet";
import { type FastNearApiType } from "./fastnear";
import { type NearBlocksApiNewType } from "./nearBlocksApiNew";
import { type PikeSpeakApiType } from "./pikespeak";

export type Config = {
  networkId: "mainnet" | "testnet";
  urls: {
    rpc: string;
    nearBlocksApiUrl: string;
    myNearWalletUrl: string;

    kitWallet: KitWalletUrls;
    nearBlocksApiUI: NearBlocksUrls;
    nearBlocksApi: NearBlocksApiNewType;
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
