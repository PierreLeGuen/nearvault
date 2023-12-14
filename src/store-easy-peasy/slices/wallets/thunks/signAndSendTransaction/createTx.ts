import { PublicKey } from "near-api-js/lib/utils";
import { utils } from "near-api-js";
import { createTransaction } from "near-api-js/lib/transaction";
import { getActions } from "~/store-easy-peasy/slices/wallets/thunks/signAndSendTransaction/getActions";
import { JsonRpcProvider } from "near-api-js/lib/providers";

const getAccessKey = async ({ rpcUrl, senderId, publicKey }: any) => {
  const provider = new JsonRpcProvider({ url: rpcUrl });
  return await provider.query(`access_key/${senderId}/${publicKey}`, "");
};

export const createTx = async ({
  rpcUrl,
  senderId,
  publicKey,
  receiverId,
  action,
  actions,
}: any) => {
  const accessKey: any = await getAccessKey({ rpcUrl, senderId, publicKey });
  const nonce = accessKey.nonce + 1;
  const blockHash = utils.serialize.base_decode(accessKey.block_hash);

  return createTransaction(
    senderId,
    PublicKey.from(publicKey),
    receiverId,
    nonce,
    getActions(action, actions),
    blockHash,
  );
};
