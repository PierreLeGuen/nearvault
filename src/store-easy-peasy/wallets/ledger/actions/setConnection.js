import { action } from 'easy-peasy';

export const setConnection = action((state, payload) => {
  state.near = payload;
  state.connection = payload.connection;
  state.config = payload.config;
  state.accountCreator = payload.accountCreator;
})