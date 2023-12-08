import { persist } from 'easy-peasy';
import { myNearWallet } from './myNearWallet';
import { ledger } from './ledger';
import { initState } from './initState';
import { actions } from './actions';

export const wallets = persist(
  {
    ...initState,
    ...actions,
    myNearWallet,
    ledger,
  },
  { storage: 'localStorage', allow: ['connectInProgress'] },
);

// opeLedgerSign: action((state) => {
//   state.isOpen = true;
//   state.route = '/ledger/sign/progress';
// }),