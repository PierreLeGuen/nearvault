import { thunk } from 'easy-peasy';
import { connect } from 'near-api-js';
import { LedgerSigner } from '../helpers/LedgerSigner.ts';

const connectionConfig = {
  networkId: 'mainnet',
  nodeUrl: 'https://rpc.mainnet.near.org',
  signer: new LedgerSigner(),
};

export const createConnection = thunk(async (actions) => {
  const connection = await connect(connectionConfig);
  actions.setConnection(connection);
});
