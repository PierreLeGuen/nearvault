import { PublicKey } from "near-api-js/lib/utils";
import { utils } from "near-api-js";
import { createTransaction } from "near-api-js/lib/transaction";
import { getActions } from "~/store-easy-peasy/wallets/self/thunks/signAndSendTransaction/getActions";
import { JsonRpcProvider } from "near-api-js/lib/providers";

export const createTx = async ({
  rpcUrl,
  senderId,
  publicKey,
  receiverId,
  action,
  actions,
}: any) => {
  const provider = new JsonRpcProvider({ url: rpcUrl });

  const accessKey: any = await provider.query(
    `access_key/${senderId}/${publicKey}`,
    "",
  );

  const pk = PublicKey.from(publicKey);
  const nonce = accessKey.nonce + 1;
  const recentBlockHash = utils.serialize.base_decode(accessKey.block_hash);

  return createTransaction(
    senderId,
    pk,
    receiverId,
    nonce,
    getActions(action, actions),
    recentBlockHash,
  );
};
