import ContentCentered from "~/components/ContentCentered";
import { MultisigAccount } from "~/components/approval/manage/ManageMultisigAccounts/MultisigAccount/MultisigAccount";
import HeaderTitle from "~/components/ui/header";

export const ManageMultisigAccounts = ({ multisigAccounts }: any) => {
  return (
    <ContentCentered>
      <HeaderTitle level="h1" text="Manage wallets" />
      {multisigAccounts.map((account: any) => (
        <MultisigAccount key={account.accountId} account={account} />
      ))}
    </ContentCentered>
  );
};
