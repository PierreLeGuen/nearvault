import { Config } from "./config";

const urls = {
  kitWallet: "https://api.kitwallet.app",
};

export const mainnet: Config = {
  networkId: "mainnet",
  urls: {
    rpc: "https://rpc.mainnet.near.org",
    myNearWallet: "https://app.mynearwallet.com",
    kitWallet: {
      stakingPools: `${urls.kitWallet}/stakingPools`,
    },
  },
  getUrl: {
    txDetails: (hash) => `https://nearblocks.io/txns/${hash}`,
    accountDetails: (accountId) => `https://nearblocks.io/address/${accountId}`,
    kitWallet: {
      keyAccounts: (publicKey) =>
        `${urls.kitWallet}/publicKey/${publicKey}/accounts`,
      likelyTokens: (accountId) =>
        `${urls.kitWallet}/account/${accountId}/likelyTokensFromBlock?fromBlockTimestamp=0`,
      stakingDeposits: (accountId) =>
        `${urls.kitWallet}/staking-deposits/${accountId}`,
    },
  },
  accounts: {
    multisigFactory: "multisignature.near",
    lockupFactory: "lockup.near",
    lockupFactoryFoundation: "foundation.near",
  },
};
