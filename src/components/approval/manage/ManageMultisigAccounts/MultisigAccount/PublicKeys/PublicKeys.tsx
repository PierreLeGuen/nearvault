import { TableBody } from "~/components/ui/table";
import { Key } from "~/components/approval/manage/ManageMultisigAccounts/MultisigAccount/PublicKeys/Key";

export const PublicKeys = ({ account, deleteKeyFn }: any) => (
  <TableBody>
    {account.keys.map((publicKey: string) => (
      <Key
        key={publicKey}
        publicKey={publicKey}
        contractId={account.accountId}
        deleteKeyFn={deleteKeyFn}
      />
    ))}
  </TableBody>
);
