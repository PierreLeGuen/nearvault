import { open } from "~/store-easy-peasy/slices/wallets/slices/modal/actions/open";
import { close } from "~/store-easy-peasy/slices/wallets/slices/modal/actions/close";
import { navigate } from "~/store-easy-peasy/slices/wallets/slices/modal/actions/navigate";

export const modal = {
  // init state
  isOpen: false,
  route: "/wallets",
  routeParams: null,
  // actions
  open,
  close,
  navigate,
};
