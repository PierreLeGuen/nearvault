import * as process from "process";
import { mainnet } from "~/config/mainnet";
import { testnet } from "~/config/testnet";

export type Config = {
  networkId: "mainnet" | "testnet";
  urls: {
    rpc: string;
    myNearWallet: string;
  };
  accounts: {
    multisigFactory: string,
  }
};

const getConfig = () =>
  process.env.NEXT_PUBLIC_NETWORK_ID === "mainnet" ? mainnet : testnet;

export const config: Config = getConfig();
