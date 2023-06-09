import { getSidebarLayout } from "~/components/Layout";
import { api } from "~/lib/api";
import usePersistingStore from "~/store/useStore";
import { type NextPageWithLayout } from "../_app";

const ManageTeamPage: NextPageWithLayout = () => {
  //   const [wallets, setWallets] = useState<Wallet[]>([]);

  const { currentTeam } = usePersistingStore();
  const { data: wallets } = api.teams.getWalletsForTeam.useQuery({
    teamId: currentTeam?.id || "",
  });

  const { data: members } = api.teams.getMembersForTeam.useQuery({
    teamId: currentTeam?.id || "",
  });

  return (
    <div className="prose">
      <h1>Manage Team</h1>
      <h2>Members</h2>
      <button>Invite new member</button>
      <div>List of members:</div>
      {members?.map((m) => (
        <div key={m.id}>{m.email}</div>
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
