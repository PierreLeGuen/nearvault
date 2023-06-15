import { XMarkIcon } from "@heroicons/react/20/solid";
import { type Beneficiary } from "@prisma/client";
import { toast } from "react-toastify";
import { getSidebarLayout } from "~/components/Layout";
import { api } from "~/lib/api";
import usePersistingStore from "~/store/useStore";
import { type NextPageWithLayout } from "../_app";

const Add: NextPageWithLayout = () => {
  const { currentTeam } = usePersistingStore();
  const mut = api.teams.deleteBeneficiaryForTeam.useMutation();

  if (!currentTeam) {
    throw new Error("No current team");
  }

  const {
    data: benefs,
    isLoading,
    refetch,
  } = api.teams.getBeneficiariesForTeam.useQuery({
    teamId: currentTeam.id,
  });

  const deleteBeneficiary = (b: Beneficiary) => {
    if (!currentTeam) {
      throw new Error("No current team");
    }
    mut.mutate(
      {
        beneficiaryId: b.id,
        teamId: currentTeam.id,
      },
      {
        onSettled: () => {
          void refetch();
          toast.success("Beneficiary removed");
        },
      }
    );
  };
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="prose p-3">
      <h1>Manage Beneficiaries</h1>
      <div className="flex flex-col gap-2">
        {benefs?.map((b) => (
          <div className="flex flex-row items-center gap-3" key={b.id}>
            <div>
              {b.firstName} {b.lastName}: {b.walletAddress}
            </div>
            <div>
              <button
                type="button"
                onClick={() => {
                  deleteBeneficiary(b);
                }}
                className="inline-flex items-center justify-center rounded-md border border-transparent bg-red-100 px-2 py-1 text-sm font-medium text-red-900 hover:bg-red-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
              >
                <XMarkIcon className="h-4 w-4" />
                <span>Remove</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

Add.getLayout = getSidebarLayout;

export default Add;
