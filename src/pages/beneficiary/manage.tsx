import { type Beneficiary } from "@prisma/client";
import { toast } from "react-toastify";
import { getSidebarLayout } from "~/components/Layout";
import HeaderTitle from "~/components/ui/header";
import { api } from "~/lib/api";
import { type NextPageWithLayout } from "../_app";

import { ArrowTopRightOnSquareIcon } from "@heroicons/react/20/solid";
import Link from "next/link";
import { AddBeneficiaryDialog } from "~/components/dialogs/AddBeneficiaryDialog";
import { Button } from "~/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { config } from "~/config/config";
import { useGetCurrentTeam, useListAddressBook } from "~/hooks/teams";

const Manage: NextPageWithLayout = () => {
  const currentTeamQuery = useGetCurrentTeam();
  const deleteMut = api.teams.deleteBeneficiaryForTeam.useMutation();

  const {
    data: benefs,
    isLoading,
    refetch: refetchBook,
  } = useListAddressBook();

  const deleteBeneficiary = (b: Beneficiary) => {
    deleteMut.mutate(
      {
        beneficiaryId: b.id,
        teamId: currentTeamQuery.data.id,
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
    <div className="flex flex-grow flex-col gap-10 px-24 py-10">
      <div className="flex flex-row justify-between">
        <HeaderTitle level="h1" text="Address Book" />
        <AddBeneficiaryDialog />
      </div>
      <div className="rounded-md border shadow-lg">
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
                <TableCell className="font-medium">
                  <p className="break-all">{benef.firstName}</p>
                </TableCell>
                <TableCell>
                  <span className="flex flex-row items-center gap-1">
                    <p className="break-all">{benef.walletAddress}</p>

                    <Button variant={"ghost"} size={"icon"} asChild>
                      <Link
                        href={config.urls.nearBlocks.accountDetails(
                          benef.walletAddress,
                        )}
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
