import { useSession } from "next-auth/react";
import { useState } from "react";
import { getSidebarLayout } from "~/components/Layout";
import { api } from "~/lib/api";
import usePersistingStore from "~/store/useStore";
import { type NextPageWithLayout } from "../_app";

const AddWallet: NextPageWithLayout = () => {
  const [walletId, setWalletId] = useState<string>("");

  useSession({ required: true });
  const { currentTeam } = usePersistingStore();
  const mutation = api.teams.addWalletForTeam.useMutation({});

  if (!currentTeam) {
    throw new Error("No current team");
  }

  return (
    <div className="prose p-4">
      <h1>Add wallet</h1>
      <input
        type="text"
        placeholder="Wallet ID"
        value={walletId}
        onChange={(e) => setWalletId(e.target.value)}
        className="focus:shadow-outline mt-2 w-full px-3 py-2 leading-tight text-gray-700 focus:outline-none"
      />
      <button
        className="mt-4 inline-flex justify-center rounded-md border border-transparent bg-green-100 px-4 py-2 text-sm font-medium text-green-900 hover:bg-green-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
        onClick={() => {
          mutation.mutate(
            {
              walletAddress: walletId,
              teamId: currentTeam.id,
            },
            {
              onSuccess: (data) => {
                console.log(`Created wallet: ${JSON.stringify(data)}`);
              },
              onError: (error) => {
                console.error(`Error creating team: ${error.message}`);
              },
            }
          );
        }}
      >
        Add
      </button>
    </div>
  );
};

AddWallet.getLayout = getSidebarLayout;
export default AddWallet;
