import { type Wallet } from "@prisma/client";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { getColumns } from "~/components/approval/pending/RequestsTable/getColumns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { type RequestRow } from "~/lib/explain-transaction";
import { type ApproveOrReject } from "~/pages/approval/pending";

type Props = {
  data: RequestRow[];
  wallet: Wallet;
  approveRejectFn: (
    multisigWallet: Wallet,
    requestId: number,
    kind: ApproveOrReject,
  ) => Promise<void>;
};

export const RequestsTable = ({ data, wallet, approveRejectFn }: Props) => {
  const columns = getColumns({ wallet, approveRejectFn });

  const table = useReactTable({
    data,
    columns,
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
                              {row.original.request.confirmations.map((c) => (
                                <li key={c}>{c}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div>
                          <h3 className="text-lg font-bold">Actions</h3>
                          {row.original.request.actions.map((action, index) => (
                            <div key={index} className="flex flex-col gap-1">
                              <strong>Action {index + 1}</strong>
                              {row.original.explanations[index] && (
                                <p>
                                  {
                                    row.original.explanations[index]
                                      .full_description
                                  }
                                </p>
                              )}
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
