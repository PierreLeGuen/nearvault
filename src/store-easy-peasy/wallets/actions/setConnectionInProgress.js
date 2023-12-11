import { action } from 'easy-peasy';

export const setConnectionInProgress = action((state, payload) => {
  state.connectInProgress = payload;
})