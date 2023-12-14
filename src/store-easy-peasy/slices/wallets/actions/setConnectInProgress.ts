import { action } from "easy-peasy";

export const setConnectInProgress = action((slice: any, payload: any) => {
  slice.connectInProgress = payload;
});
