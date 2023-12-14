import { action } from "easy-peasy";

export const open = action((slice: any) => {
  slice.isOpen = true;
});
