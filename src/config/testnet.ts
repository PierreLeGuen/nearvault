import { Config } from "~/config/config";

const urls = {
  kitWallet: 'https://testnet-api.kitwallet.app'
}

export const testnet: Config = {
  networkId: "testnet",
  urls: {
    rpc: "https://rpc.testnet.near.org",
    myNearWallet: "https://testnet.mynearwallet.com",
    kitWallet: {
      stakingPools: `${urls.kitWallet}/stakingPools`,
    }
  },
  getUrl: {
    txDetails: (hash) => `https://testnet.nearblocks.io/txns/${hash}`,
    accountDetails: (accountId) =>
      `https://testnet.nearblocks.io/address/${accountId}`,
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
    multisigFactory: "multisignature.testnet",
    lockupFactory: "lockup.devnet", // TODO create a real one
    lockupFactoryFoundation: "foundation.testnet", // TODO create a real one
  },
};

