import { type Wallet } from "@prisma/client";
import { createColumnHelper } from "@tanstack/react-table";
import { RequestColumn } from "~/components/approval/pending/RequestsTable/RequestColumn";
import { type RequestRow } from "~/lib/explain-transaction";
import { type ApproveOrReject } from "~/pages/approval/pending";

const columnHelper = createColumnHelper<RequestRow>();

type Props = {
  wallet: Wallet;
  approveRejectFn: (
    multisig_wallet: Wallet,
    requestId: number,
    kind: ApproveOrReject,
  ) => Promise<void>;
};

const requestId = columnHelper.accessor("request.request_id", {
  header: "Request ID",
  cell: (row) => <div>{row.getValue()}</div>,
  size: 50,
  maxSize: 50,
  minSize: 50,
});

const actualReceiver = columnHelper.accessor("actual_receiver", {
  header: "Receiver",
  cell: (row) => <p className="break-all">{row.getValue()}</p>,
});

const shortDescription = columnHelper.accessor(
  "explanation.short_description",
  {
    header: "Description",
    cell: (row) => <p className="break-all">{row.getValue()}</p>,
  },
);

const confirmations = columnHelper.accessor("request", {
  id: "confirmations",
  header: "Confirmations",
  cell: (row) => (
    <div className="break-words">
      {row.getValue().confirmations.length +
        "/" +
        row.getValue().requiredConfirmations}
    </div>
  ),
  size: 50,
  maxSize: 50,
  minSize: 50,
});

const request = ({ wallet, approveRejectFn }: Props) =>
  columnHelper.accessor("request", {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <RequestColumn
        row={row}
        wallet={wallet}
        approveRejectFn={approveRejectFn}
      />
    ),
    size: 50,
    maxSize: 50,
    minSize: 50,
  });

export const getColumns = (props: Props) => [
  requestId,
  actualReceiver,
  shortDescription,
  confirmations,
  request(props),
];
