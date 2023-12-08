import { thunk } from 'easy-peasy';
import { keyStores, connect } from 'near-api-js';
import { LedgerSigner } from '../helpers/LedgerSigner.ts';

const connectionConfig = {
  networkId: 'testnet',
  nodeUrl: 'https://rpc.testnet.near.org',
  signer: new LedgerSigner(),
};

export const createConnection = thunk(async (actions) => {
  const connection = await connect(connectionConfig);
  actions.setConnection(connection);
});
