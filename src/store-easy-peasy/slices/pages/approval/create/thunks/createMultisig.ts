import { thunk } from "easy-peasy";

export const createMultisig = thunk(
  async (_, payload: any, { getStoreActions }) => {
    const actions: any = getStoreActions();
    const { creatorAccount, values } = payload;

    const contractId =
      creatorAccount?.ownerAccountId ||
      creatorAccount?.walletDetails?.walletAddress;

    if (!actions.accounts.canSignTx(contractId)) return;

    const members = values.members
      .replaceAll(" ", "")
      .split("\n")
      .join(",")
      .split(",");

    try {
      await actions.multisig.addRequest.createMultisigViaFactory({
        contractId,
        newMultisigAccountId: values.newMultisigWalletId,
        members,
        numConfirmations: Number(values.numConfirmations),
        deposit: "3.8",
      });
    } catch (e) {
      console.error(e);
    }
  },
);
