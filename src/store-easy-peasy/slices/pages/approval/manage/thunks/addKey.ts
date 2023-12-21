import { thunk } from "easy-peasy";

export const addKey = thunk(async (_, payload: any, { getStoreActions }) => {
  const actions: any = getStoreActions();
  const { contractId, publicKey } = payload;

  if (!actions.accounts.canSignTx(contractId)) return;

  try {
    await actions.multisig.addRequest.addKey({ contractId, publicKey });
  } catch (e) {
    console.error(e);
  }
});
