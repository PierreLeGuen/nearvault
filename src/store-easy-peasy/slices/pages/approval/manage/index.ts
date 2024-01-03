import { getMultisigAccounts } from '~/store-easy-peasy/slices/pages/approval/manage/thunks/getMultisigAccounts';
import { setMultisigAccounts } from '~/store-easy-peasy/slices/pages/approval/manage/actions/setMultisigAccounts';
import { addKey } from '~/store-easy-peasy/slices/pages/approval/manage/thunks/addKey';
import { deleteKey } from '~/store-easy-peasy/slices/pages/approval/manage/thunks/deleteKey';

export const manage = {
  // init state
  multisigAccounts: [],
  // actions
  setMultisigAccounts,
  // thunks
  getMultisigAccounts,
  addKey,
  deleteKey,
};