import { useState } from "react";
import { getSidebarLayout } from "~/components/Layout";
import { classNames } from "~/components/Sidebar/TeamsMenu";
import { api } from "~/lib/api";
import usePersistingStore from "~/store/useStore";
import { type NextPageWithLayout } from "../_app";

const Add: NextPageWithLayout = () => {
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [creating, setCreating] = useState<boolean>(false);
  const [infoMessage, setInfoMessage] = useState<string>("");

  const { currentTeam } = usePersistingStore();

  const mut = api.teams.addBeneficiaryForTeam.useMutation();

  const createBeneficiary = async () => {
    if (!currentTeam) {
      throw new Error("No current team");
    }

    setCreating(true);
    await mut.mutateAsync({
      firstName,
      lastName,
      walletAddress,
      teamId: currentTeam.id,
    });
    setCreating(false);
    setInfoMessage("Created beneficiary");
  };

  return (
    <div className="prose">
      <div>
        <h1>Add Beneficiary</h1>
      </div>
      <div className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Wallet Address"
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
        />
        <button
          onClick={() => void createBeneficiary()}
          className={classNames(
            "rounded bg-blue-200 px-2 py-1 hover:bg-blue-300",
            creating ? "cursor-not-allowed opacity-50" : ""
          )}
          disabled={creating}
        >
          {creating ? "Creating..." : "Create"}
        </button>
        {infoMessage && <div className="text-green-500">{infoMessage}</div>}
      </div>
    </div>
  );
};

Add.getLayout = getSidebarLayout;

export default Add;
