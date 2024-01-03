import { Config } from './config';

export const mainnet: Config = {
  networkId: 'mainnet',
  urls: {
    rpc: "https://beta.rpc.mainnet.near.org",
    myNearWallet: 'https://app.mynearwallet.com',
  },
  accounts: {
    multisigFactory: "multisignature.near",
    lockupFactory: "lockup.near"
  }
}