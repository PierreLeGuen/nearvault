import { persist } from 'easy-peasy';
import { myNearWallet } from './myNearWallet/index.js';
import { setConnectionInProgress } from './actions/setConnectionInProgress.js';
import { ledger } from './ledger/index.js';

export const wallets = persist(
  {
    connectInProgress: null,
    myNearWallet,
    ledger,
    // actions
    setConnectionInProgress,
  },
  { storage: 'localStorage', allow: ['connectInProgress'] },
);
