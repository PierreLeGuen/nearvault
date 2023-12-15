import { action } from "easy-peasy";

export const selectAccount = action((slice: any, accountId: string) => {
  slice.selected = slice.map[accountId];
});
