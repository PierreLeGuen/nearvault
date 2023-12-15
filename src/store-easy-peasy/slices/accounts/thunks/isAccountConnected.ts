import { thunk } from "easy-peasy";

export const isAccountConnected = thunk((_, accountId: any, { getState }) => {
  const slice: any = getState();
  return Boolean(slice.map[accountId]);
});
