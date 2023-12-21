import { TableCell, TableRow } from "~/components/ui/table";
import { Button } from "~/components/ui/button";

export const Key = ({ accountId, publicKey, addRequestRemoveKey }: any) => {
  const deleteKey = () => addRequestRemoveKey(accountId, publicKey);

  return (
    <TableRow>
      <TableCell>
        <p className="break-all">{publicKey}</p>
      </TableCell>
      <TableCell className="text-right">
        <Button variant="destructive" onClick={deleteKey}>
          Delete
        </Button>
      </TableCell>
    </TableRow>
  );
};
