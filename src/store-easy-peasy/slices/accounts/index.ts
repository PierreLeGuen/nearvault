import { persist } from "easy-peasy";
import { selectAccount } from "~/store-easy-peasy/slices/accounts/actions/selectAccount";
import { addAccounts } from "~/store-easy-peasy/slices/accounts/actions/addAccounts";
import { canSignTx } from "~/store-easy-peasy/slices/accounts/thunks/canSignTx";
import { Accounts } from "~/store-easy-peasy/slices/accounts/types";
import { logOutFromAccounts } from "./actions/logOutFromAccounts";

const model = {
  selected: null,
  list: [],
  map: {},
  // actions
  selectAccount,
  addAccounts,
  logOutFromAccounts,
  // thunks
  canSignTx,
};

export const accounts = persist<Accounts>(model, {
  storage: "localStorage",
  allow: ["selected", "list", "map"],
});
