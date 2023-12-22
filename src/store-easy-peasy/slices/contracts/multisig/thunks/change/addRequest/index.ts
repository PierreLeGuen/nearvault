import { addKey } from "~/store-easy-peasy/slices/contracts/multisig/thunks/change/addRequest/addKey";
import { deleteKey } from "~/store-easy-peasy/slices/contracts/multisig/thunks/change/addRequest/deleteKey";
import { deleteMember } from "~/store-easy-peasy/slices/contracts/multisig/thunks/change/addRequest/deleteMember";
import { createMultisigViaFactory } from '~/store-easy-peasy/slices/contracts/multisig/thunks/change/addRequest/createMultisigViaFactory';

export const addRequest = {
  addKey,
  deleteKey,
  deleteMember,
  createMultisigViaFactory,
};
