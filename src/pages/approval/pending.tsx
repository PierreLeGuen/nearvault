import { type Wallet } from "@prisma/client";
import ContentCentered from "~/components/ContentCentered";
import { getSidebarLayout } from "~/components/Layout";
import { RequestsTable } from "~/components/approval/pending/RequestsTable/RequestsTable";
import HeaderTitle from "~/components/ui/header";
import { useConfirmRequest, useDeleteRequest } from "~/hooks/manage";
import { useGetMultisigRequestRowsForTeam } from "~/hooks/multisig";
import { useWalletTerminator } from "~/store/slices/wallet-selector";
import { type NextPageWithLayout } from "../_app";

export type ApproveOrReject = "approve" | "reject";

const Pending: NextPageWithLayout = () => {
  const wsStore = useWalletTerminator();

  const confirmRequest = useConfirmRequest();
  const deleteRequest = useDeleteRequest();
  const query = useGetMultisigRequestRowsForTeam();

  const approveOrRejectRequest = async (
    multisigWallet: Wallet,
    requestId: number,
    kind: ApproveOrReject,
  ) => {
    const multisigAccountId = multisigWallet.walletAddress;

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
      console.error(e);
    }
  };

  if (query.isLoading) {
    return (
      <ContentCentered className="px-12 py-10 lg:px-12">
        <HeaderTitle level="h1" text="Pending requests" />
        <p>Loading...</p>
      </ContentCentered>
    );
  }

  console.log("pending requests", query.data);

  return (
    <ContentCentered className="px-12 py-10 lg:px-12">
      <HeaderTitle level="h1" text="Pending requests" />
      {Array.from(query.data)
        .sort((a, b) => a[0].walletAddress.localeCompare(b[0].walletAddress))
        .map(([wallet, _requests], idx) =>
          _requests.length === 0 ? null : (
            <div key={wallet.id + idx} className="mb-2 border-gray-200 ">
              <h2 className="text-md mb-1 font-bold">
                Wallet ID: {wallet.walletAddress}
              </h2>
              <div>
                <RequestsTable
                  data={_requests}
                  wallet={wallet}
                  approveRejectFn={approveOrRejectRequest}
                />
              </div>
            </div>
          ),
        )}
    </ContentCentered>
  );
};

Pending.getLayout = getSidebarLayout;

export default Pending;
