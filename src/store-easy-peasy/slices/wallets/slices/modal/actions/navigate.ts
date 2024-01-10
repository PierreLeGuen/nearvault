import { action } from "easy-peasy";
import type { Navigate } from "~/store-easy-peasy/slices/wallets/slices/modal/types";

export const navigate: Navigate = action((slice, payload) => {
  if (typeof payload === "string") {
    slice.route = payload;
    slice.routeParams = null;
    return;
  }
  slice.route = payload.route;
  slice.routeParams = payload.routeParams;
});
