import { useState } from "react";
import { getSidebarLayout } from "~/components/Layout";
import { api } from "~/lib/api";
import usePersistingStore from "~/store/useStore";
import { type NextPageWithLayout } from "../_app";

const Add: NextPageWithLayout = () => {
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [walletAddress, setWalletAddress] = useState<string>("");
  const { currentTeam } = usePersistingStore();
  const mut = api.teams.addBeneficiaryForTeam.useMutation();

  const createBeneficiary = () => {
    if (!currentTeam) {
      throw new Error("No current team");
    }
    mut.mutate({
      firstName,
      lastName,
      walletAddress,
      teamId: currentTeam.id,
    });
  };

  return (
    <div>
      <div>
        <h1>Add Beneficiary</h1>
      </div>
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
      <button onClick={() => createBeneficiary()}>Create Beneficiary</button>
    </div>
  );
};

Add.getLayout = getSidebarLayout;

export default Add;
