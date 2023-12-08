import { action } from 'easy-peasy';

export const setConnection = action((state, payload) => {
  state.connection = payload;
})