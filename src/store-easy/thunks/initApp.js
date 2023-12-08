import { thunk } from 'easy-peasy';

export const initApp = thunk(async (actions, payload, { getStoreState }) => {
  const state = getStoreState();
  const connectionInProgress = state.wallets.connectInProgress;

  await Promise.all([
    actions.wallets.myNearWallet.createConnection(),
    actions.wallets.ledger.createConnection(),
  ]);

  if (
    connectionInProgress === 'my-near-wallet' &&
    window.location.pathname === '/connect/my-near-wallet/success'
  )
    actions.wallets.myNearWallet.completeConnection();
});
