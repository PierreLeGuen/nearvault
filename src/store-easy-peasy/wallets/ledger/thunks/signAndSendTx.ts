import { thunk } from "easy-peasy";
import { transactions } from "near-api-js";
import { JsonRpcProvider } from "near-api-js/lib/providers";
import { LedgerSigner } from "~/store-easy-peasy/wallets/ledger/helpers/LedgerSigner";
import { SignedTransaction, Transaction } from "@near-js/transactions";

const signTx = async (transaction: Transaction) => {
  try {
    const [_hash, signedTransaction] = await transactions.signTransaction(
      transaction,
      new LedgerSigner(),
    );
    return signedTransaction;
  } catch (e) {
    console.log("Ledger signTx error:", e);
    return false;
  }
};

const sentTx = async (signedTx: SignedTransaction, url: string) => {
  const provider = new JsonRpcProvider({ url });
  try {
    return await provider.sendJsonRpc("broadcast_tx_commit", [
      Buffer.from(signedTx.encode()).toString("base64"),
    ]);
  } catch (e) {
    console.log(e);
  }
};

export const signAndSendTx = thunk(async (_, payload: any, { getState }) => {
  const { transaction } = payload;
  const slice: any = getState();

  const signedTx = await signTx(transaction);
  if (!signedTx) return;

  const txResult = await sentTx(signedTx, slice.rpcUrl);
  console.log(txResult);
});
