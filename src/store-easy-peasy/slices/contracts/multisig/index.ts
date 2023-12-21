import { confirm } from "~/store-easy-peasy/slices/contracts/multisig/thunks/change/confirm";
import { deleteRequest } from "~/store-easy-peasy/slices/contracts/multisig/thunks/change/deleteRequest";
import { listRequestIds } from '~/store-easy-peasy/slices/contracts/multisig/thunks/view/listRequestIds';
import { getRequest } from '~/store-easy-peasy/slices/contracts/multisig/thunks/view/getRequest';
import { getNumConfirmations } from '~/store-easy-peasy/slices/contracts/multisig/thunks/view/getNumConfirmations';
import { getConfirmations } from '~/store-easy-peasy/slices/contracts/multisig/thunks/view/getConfirmations';
import { getMultisigContract } from '~/store-easy-peasy/slices/contracts/multisig/thunks/getMultisigContract';
import { getMembers } from '~/store-easy-peasy/slices/contracts/multisig/thunks/view/getMembers';
import { addRequest } from '~/store-easy-peasy/slices/contracts/multisig/thunks/change/addRequest';
import { getVersion } from '~/store-easy-peasy/slices/contracts/multisig/thunks/getVersion';

export const multisig = {
  // thunks
  confirm,
  deleteRequest,
  listRequestIds,
  getRequest,
  getNumConfirmations,
  getConfirmations,
  getMultisigContract,
  getMembers,
  getVersion,
  // slices
  addRequest,
};
