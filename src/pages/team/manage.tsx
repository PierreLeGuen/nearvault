import { useState } from "react";
import { getSidebarLayout } from "~/components/Layout";
import { api } from "~/lib/api";
import usePersistingStore from "~/store/useStore";
import { type NextPageWithLayout } from "../_app";

const ManageTeamPage: NextPageWithLayout = () => {
  const [email, setEmail] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");
  const [loadingStates, setLoadingStates] = useState<{ [id: string]: boolean }>(
    {}
  );

  const [loading, setLoading] = useState<boolean>(false);
  const [inviteMessage, setInviteMessage] = useState<string>("");
  const [invitationLink, setInvitationLink] = useState<string>("");

  const { currentTeam } = usePersistingStore();
  const inviteMutation = api.teams.inviteToTeam.useMutation();
  const deleteInviteMutation = api.teams.deleteInvitation.useMutation();
  const deleteWalletMutation = api.teams.deleteWalletForTeam.useMutation();

  const { data: wallets, refetch: refetchWallets } =
    api.teams.getWalletsForTeam.useQuery({
      teamId: currentTeam?.id || "",
    });
  const { data: members } = api.teams.getMembersForTeam.useQuery({
    teamId: currentTeam?.id || "",
  });
  const { data: invitations, refetch: refetchInvites } =
    api.teams.getInvitationsForTeam.useQuery({
      teamId: currentTeam?.id || "",
    });

  const getInvitationLink = (id: string) => {
    return window.location.origin + "/team/invitation?id=" + id;
  };

  const inviteNewMember = async () => {
    if (!currentTeam) {
      throw new Error("No current team");
    }

    if (!email) {
      throw new Error("No email");
    }

    setInviteMessage("");
    setInvitationLink("");
    setLoading(true);

    try {
      const data = await inviteMutation.mutateAsync({
        invitedEmail: email,
        teamId: currentTeam.id,
      });
      setInvitationLink(getInvitationLink(data.id));
    } catch (error) {
      setInviteMessage(`Error: ${error.message}`);
    } finally {
      setEmail("");
      setLoading(false);
      void refetchInvites();
    }
  };

  const deleteInvitation = async (id: string) => {
    setLoadingStates((prev) => ({ ...prev, [id]: true }));
    try {
      await deleteInviteMutation.mutateAsync({ invitationId: id });
    } catch (error) {
      console.error(error);
    } finally {
      await refetchInvites();
      setLoadingStates((prev) => ({ ...prev, [id]: false }));
    }
  };

  const deleteWallet = async (id: string) => {
    if (!currentTeam) {
      throw new Error("No current team");
    }
    setLoadingStates((prev) => ({ ...prev, [id]: true }));

    try {
      await deleteWalletMutation.mutateAsync({
        walletId: id,
        teamId: currentTeam.id,
      });
      await refetchInvites();
    } catch (error) {
      console.error(error);
    } finally {
      void refetchWallets();
      setLoadingStates((prev) => ({ ...prev, [id]: false }));
    }
  };

  return (
    <div className="prose ml-2">
      <h1>Manage Team</h1>
      <h2>Members</h2>
      <h3>Invite user to team</h3>
      <div className="inline-flex gap-3">
        <input
          type="text"
          placeholder="email"
          onChange={(e) => setEmail(e.target.value)}
          value={email}
        />
        <button
          onClick={() => void inviteNewMember()}
          disabled={loading}
          className="rounded bg-blue-200 px-3 py-1 hover:bg-blue-300"
        >
          {loading ? "Inviting..." : "Invite new member"}
        </button>
      </div>
      <div>{inviteMessage}</div>
      {invitationLink && (
        <div>
          <div>Share link to user </div>
          <a href={invitationLink}>{invitationLink}</a>
        </div>
      )}
      <h3>List of members:</h3>
      {members?.map((m) => (
        <div key={m.id}>{m.email}</div>
      ))}
      <h3>List of pending invitations:</h3>
      <div className="flex flex-col gap-3">
        {invitations?.map((i) => (
          <div key={i.id} className="inline-flex items-center gap-3">
            <span>{i.invitedEmail}</span>
            <button
              onClick={() => {
                void deleteInvitation(i.id);
              }}
              className="rounded bg-red-200 px-3 py-1 hover:bg-red-300"
            >
              {loadingStates[i.id] ? "Deleting..." : "Delete"}
            </button>
          </div>
        ))}
      </div>

      <h2>Wallets</h2>
      <h3>List of wallets:</h3>
      {wallets?.map((w) => (
        <div key={w.id} className="inline-flex gap-3">
          <div>{w.walletAddress}</div>
          <button
            onClick={() => {
              void deleteWallet(w.id);
            }}
            className="rounded bg-red-200 px-3 py-1 hover:bg-red-300"
          >
            {loadingStates[w.id] ? "Deleting..." : "Delete"}
          </button>
        </div>
      ))}
    </div>
  );
};

ManageTeamPage.getLayout = getSidebarLayout;

export default ManageTeamPage;
