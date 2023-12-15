import { Transaction } from "@near-js/transactions";
import { transactions } from "near-api-js";
import { LedgerSigner } from "~/store-easy-peasy/slices/wallets/slices/ledger/helpers/LedgerSigner";

export const signTx = async (
  transaction: Transaction,
  navigate: any,
  retrySignTxFn: any,
) => {
  navigate("/ledger/sign/progress");

  try {
    const [_, signedTransaction] = await transactions.signTransaction(
      transaction,
      new LedgerSigner(),
    );
    return signedTransaction;
  } catch (error) {
    navigate({
      route: "/ledger/sign/error",
      routeParams: { error, retrySignTxFn },
    });
    console.log("Ledger signTx error:", error);
  }
};
