import { useSession } from "next-auth/react";
import { useState } from "react";
import { toast } from "react-toastify";
import { getSidebarLayout } from "~/components/Layout";
import { AddMemberDialog } from "~/components/dialogs/AddMemberDialog";
import { AddWalletDialog } from "~/components/dialogs/AddWalletDialog";
import { Button } from "~/components/ui/button";
import HeaderTitle from "~/components/ui/header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  useDeleteTeamMember,
  useGetCurrentTeam,
  useGetInvitationsForTeam,
  useGetTeamMembers,
  useListWallets,
  useRemoveInvitation,
} from "~/hooks/teams";
import { api } from "~/lib/api";
import { type NextPageWithLayout } from "../_app";

const ManageTeamPage: NextPageWithLayout = () => {
  const rmInvitationMut = useRemoveInvitation();
  const deleteTeamMember = useDeleteTeamMember();

  const [loadingStates, setLoadingStates] = useState<{ [id: string]: boolean }>(
    {},
  );
  const currentTeamQuery = useGetCurrentTeam();
  const { data: members, refetch: refetchTeamMembers } = useGetTeamMembers();
  const { data: wallets, refetch: refetchWallets } = useListWallets();

  const connectedUser = useSession().data?.user.email;

  const deleteWalletMutation = api.teams.deleteWalletForTeam.useMutation();

  const { data: invitations, refetch: refetchInvites } =
    useGetInvitationsForTeam();

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard");
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const getInvitationLink = (id: string) => {
    return window.location.origin + "/team/invitation?id=" + id;
  };

  const deleteTeamMemberFn = async (id: string) => {
    try {
      await deleteTeamMember.mutateAsync({
        memberId: id,
        teamId: currentTeamQuery.data.id,
      });
      await refetchTeamMembers();
      toast.success("Member deleted");
    } catch (error) {
      toast.error(
        "Failed to delete member, error: " + (error as Error).message,
      );
    }
  };

  const deleteInvitation = async (id: string) => {
    setLoadingStates((prev) => ({ ...prev, [id]: true }));
    try {
      await rmInvitationMut.mutateAsync({ invitationId: id });
    } catch (error) {
      console.error(error);
    } finally {
      await refetchInvites();
      setLoadingStates((prev) => ({ ...prev, [id]: false }));
    }
  };

  const deleteWallet = async (id: string) => {
    setLoadingStates((prev) => ({ ...prev, [id]: true }));

    try {
      await deleteWalletMutation.mutateAsync({
        walletId: id,
        teamId: currentTeamQuery.data.id,
      });
      toast.success("Wallet deleted");
    } catch (error) {
      toast.error(
        "Failed to delete wallet, error: " + (error as Error).message,
      );
      console.error(error);
    } finally {
      await refetchInvites();
      void refetchWallets();
      setLoadingStates((prev) => ({ ...prev, [id]: false }));
    }
  };

  return (
    <div className="flex flex-grow flex-col gap-10 px-36 py-10">
      <HeaderTitle level="h1" text="Manage team" />
      <div className="flex flex-row justify-between">
        <HeaderTitle level="h2" text="Members" />
        <AddMemberDialog />
      </div>
      <div className="rounded-md border shadow-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members?.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="font-medium">
                  <p className="break-all">{member.email}</p>
                </TableCell>
                <TableCell>
                  <p className="break-all">{member.name}</p>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="destructive"
                    onClick={() => deleteTeamMemberFn(member.id)}
                    disabled={member.email === connectedUser}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {(invitations || []).length > 0 && (
        <>
          <div className="flex flex-row justify-between">
            <HeaderTitle level="h2" text="Pending invitations" />
          </div>
          <div className="rounded-md border shadow-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations?.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell className="font-medium">
                      <p className="break-all">{invitation.invitedEmail}</p>
                    </TableCell>
                    <TableCell className="flex justify-end gap-3">
                      <Button
                        variant={"outline"}
                        onClick={() =>
                          void copyToClipboard(getInvitationLink(invitation.id))
                        }
                      >
                        Copy invitation link
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => deleteInvitation(invitation.id)}
                        disabled={loadingStates[invitation.id]}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      <div className="flex flex-row justify-between">
        <HeaderTitle level="h2" text="Wallets" />
        <AddWalletDialog />
      </div>
      <div className="rounded-md border shadow-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Wallet ID</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {wallets
              ?.sort((a, b) => a.walletAddress.localeCompare(b.walletAddress))
              .map((wallet) => (
                <TableRow key={wallet.id}>
                  <TableCell className="font-medium">
                    <p className="break-all">{wallet.walletAddress}</p>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="destructive"
                      onClick={() => {
                        void deleteWallet(wallet.id);
                      }}
                    >
                      Remove
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

ManageTeamPage.getLayout = getSidebarLayout;

export default ManageTeamPage;
