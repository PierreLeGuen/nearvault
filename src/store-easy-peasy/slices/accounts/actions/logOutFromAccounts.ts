import { action } from "easy-peasy";
import { LogOutFromAccounts } from "../types";

export const logOutFromAccounts: LogOutFromAccounts = action((slice) => {
  slice.selected = null;
  slice.list = [];
  slice.map = {};
});
