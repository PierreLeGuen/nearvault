import { action } from "easy-peasy";
import type { Close } from '~/store-easy-peasy/slices/wallets/slices/modal/types';

export const close: Close = action((slice) => {
  if (slice.route === "/ledger/connect/progress") return;
  slice.isOpen = false;
});
