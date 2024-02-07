import { Key } from "~/components/approval/manage/ManageMultisigAccounts/MultisigAccount/PublicKeys/Key";
import { TableBody } from "~/components/ui/table";

export const PublicKeys = ({ multisigContractId }: any) => (
  <TableBody>
    {multisigContractId.keys.map((publicKey: string) => (
      <Key
        key={publicKey}
        publicKey={publicKey}
        contractId={multisigContractId.accountId}
      />
    ))}
  </TableBody>
);
