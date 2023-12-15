import { open } from "~/store-easy-peasy/slices/wallets/slices/modal/actions/open";
import { close } from "~/store-easy-peasy/slices/wallets/slices/modal/actions/close";
import { navigate } from "~/store-easy-peasy/slices/wallets/slices/modal/actions/navigate";

export const modal = {
  // init state
  isOpen: false,
  route: "/wallets",
  routeParams: null,

  // isOpen: true,
  // route: "/ledger/sign/error",
  // routeParams: {
  //   error: { message: "Transaction failed" },
  //   tx: { receiverId: "dadadda.near" },
  //   outcome: {
  //     transaction: { hash: "4W5oo3KjV1UiXbKoC92YVYCzo4CSKSEK4QUxrCWyHm4y" },
  //   },
  // },

  // actions
  open,
  close,
  navigate,
};
