import { action } from "easy-peasy";

export const openSelector = action((state: any) => {
  state.selector.isOpen = true;
});
