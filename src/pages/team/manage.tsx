import { useState } from "react";
import { getSidebarLayout } from "~/components/Layout";
import { api } from "~/lib/api";
import usePersistingStore from "~/store/useStore";
import { type NextPageWithLayout } from "../_app";

const ManageTeamPage: NextPageWithLayout = () => {
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [inviteMessage, setInviteMessage] = useState<string>("");
  const [invitationLink, setInvitationLink] = useState<string>("");

  const { currentTeam } = usePersistingStore();
  const inviteMutation = api.teams.inviteToTeam.useMutation();
  const deleteInviteMutation = api.teams.deleteInvitation.useMutation();

  const { data: wallets } = api.teams.getWalletsForTeam.useQuery({
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
    try {
      await deleteInviteMutation.mutateAsync({ invitationId: id });
      await refetchInvites();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="prose">
      <h1>Manage Team</h1>
      <h2>Members</h2>{" "}
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
      <div>
        <a href={invitationLink}>{invitationLink}</a>
      </div>
      <h3>List of members:</h3>
      {members?.map((m) => (
        <div key={m.id}>{m.email}</div>
      ))}
      <h3>List of pending invitations:</h3>
      {invitations?.map((i) => (
        <div key={i.id} className="inline-flex items-center gap-3">
          <span>{i.invitedEmail}</span>
          <button
            onClick={() => {
              void deleteInvitation(i.id);
            }}
            className="rounded bg-red-200 px-3 py-1 hover:bg-red-300"
          >
            Delete
          </button>
        </div>
      ))}
      <h2>Wallets</h2>
      <div>List of wallets:</div>
      {wallets?.map((w) => (
        <div key={w.id}>{w.walletAddress}</div>
      ))}
    </div>
  );
};

ManageTeamPage.getLayout = getSidebarLayout;

export default ManageTeamPage;
