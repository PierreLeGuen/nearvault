import { action } from "easy-peasy";
import type { Open } from '~/store-easy-peasy/slices/wallets/slices/modal/types';

export const open: Open = action((slice) => {
  slice.isOpen = true;
});
