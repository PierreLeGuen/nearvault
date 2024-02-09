import { AddKey } from "~/components/dialogs/AddKeyDialog";
import HeaderTitle from "~/components/ui/header";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { useGetAccountKeys } from "~/hooks/multisig";
import { Key } from "./Key";
import { SetNumberConfirmations } from "./SetNumberConfirmations";

export const MultisigAccount = ({ accountId }: { accountId: string }) => {
  const query = useGetAccountKeys(accountId);

  if (query.isLoading) {
    return (
      <div>
        <HeaderTitle level="h3" text={accountId} />
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-row justify-between">
        <HeaderTitle level="h3" text={accountId} />
        <span className="inline-flex gap-3">
          <AddKey accountId={accountId} />
          <SetNumberConfirmations
            accountId={accountId}
            maxThreshold={query.data.keys.length}
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
          <TableBody>
            {query.data.keys.map((key) => (
              <Key
                key={key.public_key}
                publicKey={key.public_key}
                contractId={accountId}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
};
