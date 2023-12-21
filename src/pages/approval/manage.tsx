import { useStoreState } from "easy-peasy";
import { getSidebarLayout } from "~/components/Layout";
import { handleWalletRequestWithToast } from "~/components/toast-request-result";
import { ManageMultisigAccounts } from "~/components/approval/manage/ManageMultisigAccounts/ManageMultisigAccounts";
import { useGetMultisigAccounts } from "~/store-easy-peasy/slices/pages/approval/manage/hooks/useGetMultisigAccounts";
import { type Wallet } from "@near-finance-near-wallet-selector/core";
import { type NextPageWithLayout } from "../_app";

const Manage: NextPageWithLayout = () => {
  const isLoading = useGetMultisigAccounts();
  const multisigAccounts = useStoreState(
    (store: any) => store.pages.approval.manage.multisigAccounts,
  );

  if (isLoading)
    return (
      <div className="flex w-full items-center justify-center">
        <p>Loading...</p>
      </div>
    );

  return multisigAccounts.length > 0 ? (
    <ManageMultisigAccounts multisigAccounts={multisigAccounts} />
  ) : (
    <div className="flex w-full items-center justify-center">
      <p>No accounts</p>
    </div>
  );
};
// TODO Remove after refactor
export const addRequestToMultisigWallet = async (
  w: Wallet,
  multisigWallet: string,
  receiverWallet: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  actions: any[],
) => {
  await handleWalletRequestWithToast(
    w.signAndSendTransaction({
      receiverId: multisigWallet,
      actions: [
        {
          type: "FunctionCall",
          params: {
            gas: "300000000000000",
            deposit: "0",
            methodName: "add_request",
            args: {
              request: {
                receiver_id: receiverWallet,
                actions: actions,
              },
            },
          },
        },
      ],
    }),
  );
};

Manage.getLayout = getSidebarLayout;

export default Manage;
