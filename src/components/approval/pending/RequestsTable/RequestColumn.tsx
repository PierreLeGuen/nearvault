import { XMarkIcon } from "@heroicons/react/20/solid";
import { type Wallet } from "@prisma/client";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "@radix-ui/react-icons";
import { type Row } from "@tanstack/react-table";
import { Button } from "~/components/ui/button";
import { useUsableKeysForSigning } from "~/hooks/multisig";
import { type RequestRow } from "~/lib/explain-transaction";

export const RequestColumn = ({
  row,
  wallet,
  approveRejectFn,
}: {
  row: Row<RequestRow>;
  wallet: Wallet;
  approveRejectFn: (
    multisigWallet: Wallet,
    requestId: number,
    kind: "approve" | "reject",
  ) => Promise<void>;
}) => {
  const query = useUsableKeysForSigning(
    wallet.walletAddress,
    row.original.request.request_id,
  );

  const approve = async () => {
    await approveRejectFn(wallet, row.original.request.request_id, "approve");
    await query.refetch();
  };

  const reject = async () => {
    await approveRejectFn(wallet, row.original.request.request_id, "reject");
    await query.refetch();
  };

  const toggleExpanded = () => row.toggleExpanded(!row.getIsExpanded());

  return (
    <div className="flex w-[150px] flex-row space-x-2">
      <Button
        className="bg-green-500 hover:bg-green-400"
        size="icon"
        onClick={approve}
      >
        <CheckIcon className="h-5 w-5 text-white" />
      </Button>
      <Button variant="destructive" size="icon" onClick={reject}>
        <XMarkIcon className="h-5 w-5 text-white" />
      </Button>
      <Button onClick={toggleExpanded} variant="ghost" size="icon">
        {row.getIsExpanded() ? (
          <ChevronDownIcon className="h-5 w-5" />
        ) : (
          <ChevronRightIcon className="h-5 w-5" />
        )}
      </Button>
    </div>
  );
};
