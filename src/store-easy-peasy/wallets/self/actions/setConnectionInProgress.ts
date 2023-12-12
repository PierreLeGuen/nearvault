import { action } from 'easy-peasy';

export const setConnectionInProgress = action((state: any, payload: any) => {
  state.connectInProgress = payload;
})