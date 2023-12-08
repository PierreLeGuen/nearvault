import { setConnection } from './actions/setConnection.js';
import { createConnection } from './thunks/createConnection.js';
import { connect } from './thunks/connect.js';

export const ledger = {
  connection: null,
  // actions
  setConnection,
  // thunks
  createConnection,
  connect,
};
