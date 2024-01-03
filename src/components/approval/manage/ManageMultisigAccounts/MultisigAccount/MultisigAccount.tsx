import HeaderTitle from "~/components/ui/header";
import { AddKey } from '~/components/approval/manage/ManageMultisigAccounts/MultisigAccount/AddKey';
import { Table, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { PublicKeys } from "~/components/approval/manage/ManageMultisigAccounts/MultisigAccount/PublicKeys/PublicKeys";

export const MultisigAccount = ({ account, deleteKeyFn }: any) => (
  <>
    <div className="flex flex-row justify-between">
      <HeaderTitle level="h3" text={account.accountId} />
      <AddKey accountId={account.accountId} />
    </div>
    <div className="rounded-md border shadow-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Public key</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <PublicKeys account={account} deleteKeyFn={deleteKeyFn} />
      </Table>
    </div>
  </>
);
