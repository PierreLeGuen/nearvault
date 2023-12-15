import { action } from "easy-peasy";

export const navigate = action((slice: any, payload: any) => {
  if (typeof payload === "string") {
    slice.route = payload;
    slice.routeParams = null;
    return;
  }
  slice.route = payload.route;
  slice.routeParams = payload.routeParams;
});
