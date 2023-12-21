import { thunk } from "easy-peasy";

export const deleteKey = thunk(async (_, payload: any, { getStoreActions }) => {
  const actions: any = getStoreActions();
  const { contractId, publicKey } = payload;

  if (!actions.accounts.canSignTx(contractId)) return;

  try {
    const version = await actions.multisig.getVersion(contractId);

    const method =
      version === 1
        ? actions.multisig.addRequest.deleteKey
        : actions.multisig.addRequest.deleteMember;

    await method({ contractId, publicKey });
  } catch (e) {
    console.error(e);
  }
});
