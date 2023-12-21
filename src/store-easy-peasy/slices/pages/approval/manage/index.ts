import { getMultisigAccounts } from '~/store-easy-peasy/slices/pages/approval/manage/thunks/getMultisigAccounts';
import { setMultisigAccounts } from '~/store-easy-peasy/slices/pages/approval/manage/actions/setMultisigAccounts';

export const manage = {
  // init state
  multisigAccounts: [],
  // actions
  setMultisigAccounts,
  // thunks
  getMultisigAccounts,
};