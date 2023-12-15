import { XMarkIcon } from "@heroicons/react/20/solid";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "@radix-ui/react-icons";
import { PublicKey } from "near-api-js/lib/utils";
import { Button } from "~/components/ui/button";
import { RequestRow } from "~/lib/explain-transaction";

const isPublicKeyInConfirmations = (
  requestRow: RequestRow,
  publicKey: PublicKey | undefined,
) =>
  publicKey && requestRow.request.confirmations.includes(publicKey.toString());

export const RequestColumn = ({
  row,
  wallet,
  approveRejectFn,
  publicKey,
}: any) => {
  const isConfirmed = isPublicKeyInConfirmations(row.original, publicKey);

  const approve = () => {
    approveRejectFn(wallet, row.original.request.request_id, "approve").catch(
      (e: any) => {
        console.error(e);
      },
    );
  };

  const reject = () => {
    approveRejectFn(wallet, row.original.request.request_id, "reject").catch(
      (e: any) => {
        console.error(e);
      },
    );
  };

  const toggleExpanded = () => row.toggleExpanded(!row.getIsExpanded());

  return (
    <div className="flex w-[150px] flex-row space-x-2">
      <Button
        className="bg-green-500 hover:bg-green-400"
        size="icon"
        disabled={isConfirmed}
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
