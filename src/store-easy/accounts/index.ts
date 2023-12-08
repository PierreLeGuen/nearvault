import { persist } from 'easy-peasy';
import { initState } from './initState';
import { actions } from './actions';

export const accounts = persist(
  {
    ...initState,
    ...actions,
  },
  { storage: 'localStorage' },
);
