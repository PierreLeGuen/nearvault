import { PublicKey } from "near-api-js/lib/utils";
import { utils } from "near-api-js";
import { AccessKey, createTransaction } from "near-api-js/lib/transaction";
import { getActions } from "~/store-easy-peasy/slices/wallets/thunks/signAndSendTransaction/getActions";
import { JsonRpcProvider } from "near-api-js/lib/providers";
import { AccessKeyView, QueryResponseKind } from "near-api-js/lib/providers/provider";

const getAccessKey = async ({ rpcUrl, senderId, publicKey }: {rpcUrl: string, senderId: string, publicKey: PublicKey}) => {
  console.log('getAccessKey', { rpcUrl, senderId, publicKey });
  
  const provider = new JsonRpcProvider({ url: rpcUrl });
  console.log(publicKey.toString());
  
  const args = {
    request_type: "view_access_key",
    finality: "final",
    account_id: senderId,
    public_key: publicKey.toString(),
  };
  console.log("args", args);
  
  const ak = await provider.query(args);
  console.log(ak);
  
  return ak;
};

type CreateTx = {
  rpcUrl: string;
  senderId: string;
  publicKey: PublicKey;
  receiverId: string;
  action: any;
  actions: any[];
};


export const createTx = async ({
  rpcUrl,
  senderId,
  publicKey,
  receiverId,
  action,
  actions,
}: CreateTx) => {
  console.log('createTx', { rpcUrl, senderId, publicKey: publicKey.toString(), receiverId, action, actions });

  const accessKey: any = await getAccessKey({ rpcUrl, senderId, publicKey });
  const nonce = accessKey.nonce + 1_000;
  const blockHash = utils.serialize.base_decode(accessKey.block_hash);

  console.log('createTx', { accessKey, nonce, blockHash, blockHashStr: utils.serialize.base_encode(blockHash) });

  const tx = createTransaction(
    senderId,
    publicKey,
    receiverId,
    nonce,
    getActions(action, actions),
    blockHash,
  );
  console.log('after: createTransaction', { tx });
  
  return tx;
};
