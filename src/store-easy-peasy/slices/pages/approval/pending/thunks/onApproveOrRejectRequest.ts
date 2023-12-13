import { thunk } from "easy-peasy";

export const onApproveOrRejectRequest = thunk(
  async (_, payload: any, { getStoreActions }) => {
    const actions: any = getStoreActions();
    const { multisigAccountId, requestId, kind } = payload;

    const method =
      kind === "approve"
        ? actions.multisig.confirm
        : actions.multisig.deleteRequest;

    console.log("onApproveOrRejectRequest", multisigAccountId, requestId, kind);
    await method({ multisigAccountId, requestId });
  },
);
