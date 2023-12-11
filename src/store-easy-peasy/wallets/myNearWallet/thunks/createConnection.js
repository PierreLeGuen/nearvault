import { thunk } from 'easy-peasy';
import { keyStores, connect } from 'near-api-js';

const myKeyStore = new keyStores.InMemoryKeyStore();

const connectionConfig = {
  networkId: 'mainnet',
  keyStore: myKeyStore,
  nodeUrl: 'https://rpc.mainnet.near.org',
  walletUrl: 'https://app.mynearwallet.com',
};

export const createConnection = thunk(async (actions) => {
  const connection = await connect(connectionConfig);
  actions.setConnection(connection);
});
