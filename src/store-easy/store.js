import { createStore, persist } from 'easy-peasy';
import { accounts } from './accounts';
import { wallets } from './wallets';
import { initApp } from './thunks/initApp.js';
import { addRequestAndConfirm } from './thunks/addRequestAndConfirm.js';

export const store = createStore(
  persist(
    {
      networkId: process.env.NEXT_PUBLIC_NETWORK_ID,
      accounts,
      wallets,
      // thunks
      initApp,
      addRequestAndConfirm,
    },
    { storage: 'localStorage' },
  ),
);
