import { Config } from '~/config/config';

export const testnet: Config = {
  networkId: 'testnet',
  urls: {
    rpc: "https://rpc.testnet.near.org",
    myNearWallet: 'https://testnet.mynearwallet.com',
  },
  accounts: {
    multisigFactory: "multisignature.testnet",
    lockupFactory: "lockup.devnet"
  }
}