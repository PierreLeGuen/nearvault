import ContentCentered from "~/components/ContentCentered";
import { getSidebarLayout } from "~/components/Layout";
import { ManageMultisigAccounts } from "~/components/approval/manage/ManageMultisigAccounts/ManageMultisigAccounts";
import HeaderTitle from "~/components/ui/header";
import { useListWallets } from "~/hooks/teams";
import { type NextPageWithLayout } from "../_app";

const Manage: NextPageWithLayout = () => {
  const query = useListWallets();

  if (query.isLoading)
    return (
      <ContentCentered>
        <HeaderTitle level="h1" text="Manage wallets" />
        <p>Loading...</p>
      </ContentCentered>
    );

  if (query.data.length === 0) {
    return (
      <ContentCentered>
        <HeaderTitle level="h1" text="Manage wallets" />
        <p>No accounts</p>
      </ContentCentered>
    );
  }

  return <ManageMultisigAccounts multisigAccounts={query.data} />;
};

Manage.getLayout = getSidebarLayout;

export default Manage;
