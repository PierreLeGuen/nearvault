import HeaderTitle from "~/components/ui/header";
import { MultisigAccount } from "~/components/approval/manage/ManageMultisigAccounts/MultisigAccount/MultisigAccount";

export const ManageMultisigAccounts = ({ multisigAccounts }: any) => (
  <div className="flex flex-grow flex-col gap-10 px-36 py-10">
    <HeaderTitle level="h1" text="Manage wallets" />
    {multisigAccounts.map((account: any) => (
      <MultisigAccount key={account.accountId} account={account} />
    ))}
  </div>
);
