import { thunk } from 'easy-peasy';
import { keyStores, connect } from 'near-api-js';

const myKeyStore = new keyStores.InMemoryKeyStore();

const connectionConfig = {
  networkId: 'testnet',
  keyStore: myKeyStore,
  nodeUrl: 'https://rpc.testnet.near.org',
  walletUrl: 'https://testnet.mynearwallet.com',
};

export const createConnection = thunk(async (actions) => {
  const connection = await connect(connectionConfig);
  actions.setConnection(connection);
});
