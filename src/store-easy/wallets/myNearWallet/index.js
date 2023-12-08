import { setConnection } from './actions/setConnection.js';
import { createConnection } from './thunks/createConnection.js';
import { requestConnect } from './thunks/requestConnect.js';
import { completeConnection } from './thunks/completeConnect.js';

export const myNearWallet = {
  connection: null,
  // actions
  setConnection,
  // thunks
  createConnection,
  requestConnect,
  completeConnection,
}