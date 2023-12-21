import { TableBody } from "~/components/ui/table";
import { Key } from "~/components/approval/manage/ManageMultisigAccounts/MultisigAccount/PublicKeys/Key";

export const PublicKeys = ({ account }: any) => (
  <TableBody>
    {account.keys.map((publicKey: string) => (
      <Key
        key={publicKey}
        publicKey={publicKey}
        accountId={account.accountId}
      />
    ))}
  </TableBody>
);
