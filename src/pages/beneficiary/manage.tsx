import { type Beneficiary } from "@prisma/client";
import { toast } from "react-toastify";
import { getSidebarLayout } from "~/components/Layout";
import HeaderTitle from "~/components/ui/header";
import { api } from "~/lib/api";
import usePersistingStore from "~/store/useStore";
import { type NextPageWithLayout } from "../_app";

import { ArrowTopRightOnSquareIcon } from "@heroicons/react/20/solid";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { AddDialog } from "./addDialog";

const Manage: NextPageWithLayout = () => {
  const { currentTeam } = usePersistingStore();
  const deleteMut = api.teams.deleteBeneficiaryForTeam.useMutation();

  if (!currentTeam) {
    throw new Error("No current team");
  }

  const {
    data: benefs,
    isLoading,
    refetch: refetchBook,
  } = api.teams.getBeneficiariesForTeam.useQuery({
    teamId: currentTeam.id,
  });

  const getNearblocksUrl = (walletId: string) =>
    `https://nearblocks.io/address/${walletId}`;

  const deleteBeneficiary = (b: Beneficiary) => {
    if (!currentTeam) {
      throw new Error("No current team");
    }
    deleteMut.mutate(
      {
        beneficiaryId: b.id,
        teamId: currentTeam.id,
      },
      {
        onSettled: () => {
          void refetchBook();
          toast.success("Beneficiary removed");
        },
      },
    );
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-grow flex-col gap-10 p-36">
      <div className="flex flex-row justify-between">
        <HeaderTitle level="h1" text="Address Book" />
        <AddDialog />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Identifier</TableHead>
              <TableHead>Wallet ID</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {benefs?.map((benef) => (
              <TableRow key={benef.id}>
                <TableCell className="font-medium">{benef.firstName}</TableCell>
                <TableCell>
                  <span className="flex flex-row items-center gap-1">
                    {benef.walletAddress}

                    <Button variant={"ghost"} size={"icon"} asChild>
                      <Link
                        href={getNearblocksUrl(benef.walletAddress)}
                        target="_blank"
                      >
                        <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                      </Link>
                    </Button>
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant={"destructive"}
                    onClick={() => {
                      deleteBeneficiary(benef);
                    }}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

Manage.getLayout = getSidebarLayout;

export default Manage;
