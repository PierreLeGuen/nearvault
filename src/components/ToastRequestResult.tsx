import { type FinalExecutionOutcome } from "@near-finance-near-wallet-selector/core";
import { toast } from "react-toastify";

export const handleWalletRequestWithToast = async (
  p: Promise<FinalExecutionOutcome | void>,
) => {
  const res = await toast.promise(p, {
    pending: "Check your wallet to approve the request",
    success: {
      render: (data) => {
        if (!data.data) {
          return `Successfully sent request to the multisig wallet`;
        }
        return (
          <span>
            Successfully sent request to the multisig wallet, transaction id:{" "}
            <a
              href={`https://nearblocks.io/txns/${data.data.transaction_outcome.id}`}
              target="_blank"
              className="font-bold underline"
            >
              {data.data.transaction_outcome.id}
            </a>
            `
          </span>
        );
      },
    },
    error: {
      render: (err) => {
        return `Failed to send transaction: ${(err.data as Error).message}`;
      },
    },
  });

  return res;
};
