import { Button } from "~/components/ui/button";
import { TableCell, TableRow } from "~/components/ui/table";
import { useDeleteKey } from "~/hooks/manage";

type Params = {
  contractId: string;
  publicKey: string;
};

export const Key = ({ contractId, publicKey }: Params) => {
  const deleteKeyN = useDeleteKey();

  const deleteKeyW = () => {
    deleteKeyN.mutate({ accountId: contractId, publicKey });
  };

  return (
    <TableRow>
      <TableCell>
        <p className="break-all">{publicKey}</p>
      </TableCell>
      <TableCell className="text-right">
        <Button variant="destructive" onClick={deleteKeyW}>
          Delete
        </Button>
      </TableCell>
    </TableRow>
  );
};
