import { action } from "easy-peasy";

export const closeSelector = action((state: any) => {
  if (state.connector.route === "/ledger/connect/progress") return;
  state.connector.isOpen = false;
});
