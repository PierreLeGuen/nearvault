import { useStoreActions } from "easy-peasy";
import ContentCentered from "~/components/ContentCentered";
import { MultisigAccount } from "~/components/approval/manage/ManageMultisigAccounts/MultisigAccount/MultisigAccount";
import HeaderTitle from "~/components/ui/header";

export const ManageMultisigAccounts = ({ multisigAccounts }: any) => {
  const deleteKeyFn = useStoreActions(
    (actions: any) => actions.pages.approval.manage.deleteKey,
  );

  return (
    <ContentCentered>
      <HeaderTitle level="h1" text="Manage wallets" />
      {multisigAccounts.map((account: any) => (
        <MultisigAccount
          key={account.accountId}
          account={account}
          deleteKeyFn={deleteKeyFn}
        />
      ))}
    </ContentCentered>
  );
};
