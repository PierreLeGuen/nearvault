import { action } from "easy-peasy";

export const navigate = action((state: any, payload: any) => {
  if (typeof payload === "string") {
    state.selector.route = payload;
    state.selector.routeParams = null;
    return;
  }

  state.selector.route = payload.route;
  state.selector.routeParams = payload.routeParams;
});
