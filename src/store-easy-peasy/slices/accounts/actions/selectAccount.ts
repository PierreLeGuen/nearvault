import { action } from "easy-peasy";
import type { SelectAccount } from "~/store-easy-peasy/slices/accounts/types";

export const selectAccount: SelectAccount = action((slice, accountId) => {
  slice.selected = slice.map[accountId];
});
