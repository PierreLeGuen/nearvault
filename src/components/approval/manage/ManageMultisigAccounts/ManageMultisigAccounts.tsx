import { type Wallet } from "@prisma/client";
import ContentCentered from "~/components/ContentCentered";
import { MultisigAccount } from "~/components/approval/manage/ManageMultisigAccounts/MultisigAccount";
import HeaderTitle from "~/components/ui/header";

export const ManageMultisigAccounts = ({
  multisigWallets,
}: {
  multisigWallets: Wallet[];
}) => {
  return (
    <ContentCentered>
      <HeaderTitle level="h1" text="Manage wallets" />
      {multisigWallets
        .sort((a, b) => a.walletAddress.localeCompare(b.walletAddress))
        .map((wallet) => (
          <MultisigAccount key={wallet.id} accountId={wallet.walletAddress} />
        ))}
    </ContentCentered>
  );
};
