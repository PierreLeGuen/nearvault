import { XMarkIcon } from "@heroicons/react/20/solid";
import { Wallet } from "@prisma/client";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "@radix-ui/react-icons";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { PublicKey } from "near-api-js/lib/utils";
import { Button } from "~/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { type RequestRow } from "./lib/explain";
import { ApproveOrReject } from "./pending";

const isPublicKeyInConfirmations = (
  requestRow: RequestRow,
  publicKey: PublicKey | undefined,
) => {
  return (
    publicKey && requestRow.request.confirmations.includes(publicKey.toString())
  );
};

const columnHelper = createColumnHelper<RequestRow>();

const columns = ({
  wallet,
  approveRejectFn,
  publicKey,
}: {
  wallet: Wallet;
  approveRejectFn: (
    multisig_wallet: Wallet,
    requestId: number,
    kind: ApproveOrReject,
  ) => Promise<void>;
  publicKey: PublicKey | undefined;
}) => [
  columnHelper.accessor("request.request_id", {
    header: "Request ID",
    cell: (row) => <div>{row.getValue()}</div>,
    size: 50,
    maxSize: 50,
    minSize: 50,
  }),
  columnHelper.accessor("actual_receiver", {
    header: "Receiver",
    cell: (row) => <p className="break-all">{row.getValue()}</p>,
  }),
  columnHelper.accessor("explanation.short_description", {
    header: "Description",
    cell: (row) => <p className="break-all">{row.getValue()}</p>,
  }),
  columnHelper.accessor("request", {
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
  }),
  columnHelper.accessor("request", {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const isConfirmed = isPublicKeyInConfirmations(row.original, publicKey);
      return (
        <div className="flex w-[150px] flex-row space-x-2">
          <Button
            className="bg-green-500 hover:bg-green-400"
            size="icon"
            disabled={isConfirmed}
            onClick={() => {
              approveRejectFn(
                wallet,
                row.original.request.request_id,
                "approve",
              ).catch((e) => {
                console.error(e);
              });
            }}
          >
            <CheckIcon className="h-5 w-5 text-white" />
          </Button>
          <Button
            variant={"destructive"}
            size="icon"
            onClick={() => {
              approveRejectFn(
                wallet,
                row.original.request.request_id,
                "reject",
              ).catch((e) => {
                console.error(e);
              });
            }}
          >
            <XMarkIcon className="h-5 w-5 text-white" />
          </Button>
          <Button
            onClick={() => row.toggleExpanded(!row.getIsExpanded())}
            variant={"ghost"}
            size={"icon"}
          >
            {row.getIsExpanded() ? (
              <ChevronDownIcon className="h-5 w-5" />
            ) : (
              <ChevronRightIcon className="h-5 w-5" />
            )}
          </Button>
        </div>
      );
    },

    size: 50,
    maxSize: 50,
    minSize: 50,
  }),
];

const PendingRequestsTable = ({
  data,
  wallet,
  approveRejectFn,
  publicKey,
}: {
  data: RequestRow[];
  wallet: Wallet;
  approveRejectFn: (
    multisig_wallet: Wallet,
    requestId: number,
    kind: ApproveOrReject,
  ) => Promise<void>;
  publicKey: PublicKey | undefined;
}) => {
  const table = useReactTable({
    data,
    columns: columns({ wallet, approveRejectFn, publicKey }),
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="rounded-md border shadow-lg">
      <Table className="w-full table-fixed">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} style={{ width: header.getSize() }}>
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <>
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
              {row.getIsExpanded() && (
                <TableRow>
                  <TableCell colSpan={columns.length}>
                    <div className="flex flex-row justify-between p-2">
                      <div className="flex flex-col gap-2">
                        {row.original.request.confirmations.length > 0 && (
                          <div className="flex flex-col">
                            <p className="font-bold">Approved by</p>
                            <ul>
                              {row.original.request.confirmations.map((c) => {
                                return <li key={c}>{c}</li>;
                              })}
                            </ul>
                          </div>
                        )}
                        <div>
                          <p className="font-bold">Actions</p>
                          {row.original.request.actions.map((action, index) => (
                            <div key={index} className="flex flex-col gap-1">
                              <p>Action {index + 1}</p>
                              <pre className="rounded-xl bg-slate-800 p-2 text-white">
                                {JSON.stringify(action, null, 2)}
                              </pre>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default PendingRequestsTable;
