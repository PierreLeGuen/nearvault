import { Key } from "~/components/approval/manage/ManageMultisigAccounts/MultisigAccount/PublicKeys/Key";
import { TableBody } from "~/components/ui/table";

type Props = {
  multisigContractId: any;
  deleteKeyFn: any;
};

export const PublicKeys = ({ multisigContractId, deleteKeyFn }: Props) => (
  <TableBody>
    {multisigContractId.keys.map((publicKey: string) => (
      <Key
        key={publicKey}
        publicKey={publicKey}
        contractId={multisigContractId.accountId}
        deleteKeyFn={deleteKeyFn}
      />
    ))}
  </TableBody>
);
