import { persist } from "easy-peasy";
import { selectAccount } from "~/store-easy-peasy/slices/accounts/actions/selectAccount";
import { addAccounts } from "~/store-easy-peasy/slices/accounts/actions/addAccounts";
import { canSignTx } from '~/store-easy-peasy/slices/accounts/thunks/canSignTx';

const model = {
  selected: null,
  list: [],
  map: {},
  // actions
  selectAccount,
  addAccounts,
  // thunks
  canSignTx,
};

export const accounts = persist(model, {
  storage: "localStorage",
  allow: ["selected", "list", "map"],
});
