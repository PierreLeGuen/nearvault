import { useStoreState } from "easy-peasy";
import ContentCentered from "~/components/ContentCentered";
import { getSidebarLayout } from "~/components/Layout";
import { ManageMultisigAccounts } from "~/components/approval/manage/ManageMultisigAccounts/ManageMultisigAccounts";
import HeaderTitle from "~/components/ui/header";
import { useGetMultisigAccounts } from "~/store-easy-peasy/slices/pages/approval/manage/hooks/useGetMultisigAccounts";
import { type NextPageWithLayout } from "../_app";

const Manage: NextPageWithLayout = () => {
  const isLoading = useGetMultisigAccounts();
  const multisigAccounts = useStoreState(
    (store: any) => store.pages.approval.manage.multisigAccounts,
  );

  if (isLoading)
    return (
      <ContentCentered>
        <HeaderTitle level="h1" text="Manage wallets" />
        <p>Loading...</p>
      </ContentCentered>
    );

  return multisigAccounts.length > 0 ? (
    <ManageMultisigAccounts multisigAccounts={multisigAccounts} />
  ) : (
    <ContentCentered>
      <HeaderTitle level="h1" text="Manage wallets" />
      <p>No accounts</p>
    </ContentCentered>
  );
};

Manage.getLayout = getSidebarLayout;

export default Manage;
