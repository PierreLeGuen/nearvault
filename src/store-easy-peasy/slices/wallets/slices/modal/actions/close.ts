import { action } from "easy-peasy";

export const close = action((slice: any) => {
  if (slice.route === "/ledger/connect/progress") return;
  slice.isOpen = false;
});
