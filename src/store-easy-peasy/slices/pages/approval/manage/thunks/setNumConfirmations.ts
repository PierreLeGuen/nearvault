import { thunk } from "easy-peasy";
import { Payload } from "~/store-easy-peasy/slices/contracts/multisig/thunks/change/addRequest/setNumConfirmations";

export const setNumConfirmations = thunk(
  async (_, payload: Payload, { getStoreActions }) => {
    const actions: any = getStoreActions();
    const { contractId, numConfirmations } = payload;

    if (!actions.accounts.canSignTx(contractId)) return;

    try {
      await actions.multisig.addRequest.setNumConfirmations({
        contractId,
        numConfirmations,
      });
    } catch (e) {
      console.error(e);
    }
  },
);
