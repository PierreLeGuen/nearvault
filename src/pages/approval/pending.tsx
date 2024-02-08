import { type Wallet } from "@prisma/client";
import { useSession } from "next-auth/react";
import { getSidebarLayout } from "~/components/Layout";
import { RequestsTable } from "~/components/approval/pending/RequestsTable/RequestsTable";
import HeaderTitle from "~/components/ui/header";
import { useConfirmRequest, useDeleteRequest } from "~/hooks/manage";
import { useGetMultisigRequestRowsForTeam } from "~/hooks/multisig";
import { useWalletTerminator } from "~/store/slices/wallet-selector";
import usePersistingStore from "~/store/useStore";
import { type NextPageWithLayout } from "../_app";

export type ApproveOrReject = "approve" | "reject";

const Pending: NextPageWithLayout = () => {
  useSession({ required: true });
  const wsStore = useWalletTerminator();

  const confirmRequest = useConfirmRequest();
  const deleteRequest = useDeleteRequest();
  const query = useGetMultisigRequestRowsForTeam();

  const { publicKey } = usePersistingStore(); // TODO from where we take this publicKey?

  const approveOrRejectRequest = async (
    multisigWallet: Wallet,
    requestId: number,
    kind: ApproveOrReject,
  ) => {
    const multisigAccountId = multisigWallet.walletAddress;
    console.log(multisigAccountId);

    if (!wsStore.canSignForAccount(multisigAccountId)) return;

    try {
      console.log("Approving or rejecting request", requestId, kind);

      if (kind === "approve") {
        console.log("Approving request");

        await confirmRequest.mutateAsync({
          accountId: multisigAccountId,
          requestId: requestId,
        });
      } else if (kind === "reject") {
        console.log("Rejecting request");

        await deleteRequest.mutateAsync({
          accountId: multisigAccountId,
          requestId: requestId,
        });
      }
    } catch (e) {
      console.log(e);
    }
  };

  if (query.isLoading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="flex flex-col gap-10 px-12 py-10">
      <HeaderTitle level="h1" text="Pending requests" />
      {query.data.length > 0 &&
        Array.from(query.data).map(([wallet, _requests]) =>
          _requests.length === 0 ? null : (
            <div key={wallet.id} className="mb-2 border-gray-200 ">
              <h2 className="text-md mb-1 font-bold">
                Wallet ID: {wallet.walletAddress}
              </h2>
              <div>
                <RequestsTable
                  data={_requests}
                  wallet={wallet}
                  approveRejectFn={approveOrRejectRequest}
                  publicKey={publicKey || undefined} // TODO Fix it - we have a BUG here - never have the key
                />
              </div>
            </div>
          ),
        )}
    </div>
  );
};

Pending.getLayout = getSidebarLayout;

export default Pending;
