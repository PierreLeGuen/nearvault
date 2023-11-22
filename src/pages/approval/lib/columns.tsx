import {
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "~/components/ui/button";
import { type RequestRow } from "./explain";

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Payment = {
  id: string;
  receiver: string;
  description: string;
  approvers: string[];
  threshold: number;
};

export const examplecolumns: ColumnDef<Payment>[] = [
  {
    accessorKey: "id",
    header: "Request ID",
  },
  { header: "Receiver", accessorKey: "receiver" },
  { header: "Description", accessorKey: "description" },
  {
    header: "Approvers",
    accessorFn: (row) => row.approvers.length + "/" + row.threshold,
  },
  {
    header: "Actions",
    accessorKey: "actions",
    cell: ({ row }) => (
      <div className="flex flex-row space-x-2">
        <Button className="bg-green-500 hover:bg-green-400" size="icon">
          <CheckIcon className="h-5 w-5 text-white" />
        </Button>
        <Button variant={"destructive"} size="icon">
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
    ),
  },
];

export const columns: ColumnDef<RequestRow>[] = [
  {
    accessorKey: "request.request_id",
    header: () => <span>Request ID</span>,
    minSize: 100,
    maxSize: 100,
    size: 100,
  },
  {
    header: "Receiver",
    accessorKey: "request.receiver_id",
    cell: ({ row }) => {
      console.log(row);

      return (
        <div className="flex flex-col">
          <p
            className="break-words"
            dangerouslySetInnerHTML={{
              __html: row.original.request.receiver_id || "",
            }}
          />
        </div>
      );
    },
  },
  {
    header: "Description",
    accessorKey: "explanation.short_description",

    cell: ({ row }) => {
      console.log(row);

      return (
        <div className="flex flex-col">
          <p
            className="break-words"
            dangerouslySetInnerHTML={{
              __html: row.original.explanation.short_description || "",
            }}
          />
        </div>
      );
    },
  },
  {
    accessorFn: (row) =>
      row.request.confirmations.length +
      "/" +
      row.request.requiredConfirmations,
    header: "Confirmations",
  },
  {
    header: "Actions",
    accessorKey: "actions",
    size: 150,
    cell: ({ row }) => (
      <div className="flex w-[150px] flex-row justify-end space-x-2">
        <Button className="bg-green-500 hover:bg-green-400" size="icon">
          <CheckIcon className="h-5 w-5 text-white" />
        </Button>
        <Button variant={"destructive"} size="icon">
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
    ),
  },
];
