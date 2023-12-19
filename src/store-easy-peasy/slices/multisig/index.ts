import { confirm } from "~/store-easy-peasy/slices/multisig/thunks/confirm";
import { deleteRequest } from "~/store-easy-peasy/slices/multisig/thunks/deleteRequest";
import { listRequestIds } from '~/store-easy-peasy/slices/multisig/thunks/listRequestIds';
import { getRequest } from '~/store-easy-peasy/slices/multisig/thunks/getRequest';
import { getNumConfirmations } from '~/store-easy-peasy/slices/multisig/thunks/getNumConfirmations';
import { getConfirmations } from '~/store-easy-peasy/slices/multisig/thunks/getConfirmations';
import { getMultisigContract } from '~/store-easy-peasy/slices/multisig/thunks/getMultisigContract';

export const multisig = {
  // thunks
  confirm,
  deleteRequest,
  listRequestIds,
  getRequest,
  getNumConfirmations,
  getConfirmations,
  getMultisigContract,
};
