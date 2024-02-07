import { AddKey } from "~/components/approval/manage/ManageMultisigAccounts/MultisigAccount/AddKeyDialog";
import { PublicKeys } from "~/components/approval/manage/ManageMultisigAccounts/MultisigAccount/PublicKeys/PublicKeys";
import HeaderTitle from "~/components/ui/header";
import { Table, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { SetNumberConfirmations } from "./SetNumberConfirmations";

export const MultisigAccount = ({ account }: any) => (
  <>
    <div className="flex flex-row justify-between">
      <HeaderTitle level="h3" text={account.accountId} />
      <span className="inline-flex gap-3">
        <AddKey accountId={account.accountId} />
        <SetNumberConfirmations
          accountId={account.accountId}
          maxThreshold={account.keys.length}
        />
      </span>
    </div>
    <div className="rounded-md border shadow-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Public key</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <PublicKeys multisigContractId={account} />
      </Table>
    </div>
  </>
);
