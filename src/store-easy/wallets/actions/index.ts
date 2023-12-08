import { setConnectionInProgress } from "~/store-easy/wallets/actions/setConnectionInProgress";
import { openSelector } from '~/store-easy/wallets/actions/openSelector';
import { closeSelector } from '~/store-easy/wallets/actions/closeSelector';
import { navigate } from '~/store-easy/wallets/actions/navigate';

export const actions = {
  setConnectionInProgress,
  openSelector,
  closeSelector,
  navigate,
};
