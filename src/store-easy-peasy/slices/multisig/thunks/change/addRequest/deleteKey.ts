import { thunk } from "easy-peasy";

type Payload = {
  contractId: string;
  publicKey: string;
}

export const deleteKey = thunk(async (_, payload: Payload, { getStoreActions }) => {
  const { contractId, publicKey } = payload;
  const actions: any = getStoreActions();

  if (!actions.accounts.canSignTx(contractId)) return;

  await actions.wallets.signAndSendTransaction({
    senderId: contractId,
    receiverId: contractId,
    action: {
      type: "FunctionCall",
      method: "add_request",
      args: {
        request: {
          receiver_id: contractId,
          actions: [
            {
              type: "AddKey",
              public_key: publicKey,
              permission: {
                receiver_id: contractId,
                allowance: null,
                method_names: [
                  "add_request",
                  "add_request_and_confirm",
                  "confirm",
                  "delete_request",
                ],
              },
            },
          ],
        },
      },
      tGas: 5,
    },
  });
});

/*
const FOUNDATION_MULTISIG_HASH = "55E7imniT2uuYrECn17qJAk9fLcwQW4ftNSwmCJL5Di";


const addRequestRemoveKey = async (multisigWallet: string, key: string) => {
    await assertCorrectMultisigWallet(walletSelector, multisigWallet);
    const w = await walletSelector.selector.wallet();
    const n = await newNearConnection();
    console.log("multisigWallet", multisigWallet);
    const acc = await n.account(multisigWallet);
    const state = await acc.state();
    console.log(state.code_hash);
    console.log(key);

    // Foundation multisig wallets have different methods for adding/removing keys
    if (state.code_hash === FOUNDATION_MULTISIG_HASH) {
      await addRequestToMultisigWallet(w, multisigWallet, multisigWallet, [
        {
          type: "DeleteKey",
          public_key: key,
          gas: "125000000000000",
          deposit: "0",
        },
      ]);
    } else {
      await addRequestToMultisigWallet(w, multisigWallet, multisigWallet, [
        {
          type: "DeleteMember",
          member: {
            public_key: key,
          },
          gas: "125000000000000",
          deposit: "0",
        },
      ]);
    }
  };
 */
