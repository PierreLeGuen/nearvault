import ContentCentered from "~/components/ContentCentered";
import { getSidebarLayout } from "~/components/Layout";
import HeaderTitle from "~/components/ui/header";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { config } from "~/config/config";
import { api } from "~/lib/api";
import usePersistingStore from "~/store/useStore";
import { type NextPageWithLayout } from "../_app";

const History: NextPageWithLayout = () => {
  const { currentTeam } = usePersistingStore();
  if (!currentTeam) {
    throw new Error("No current team");
  }

  const { data: transactions, isLoading } =
    api.teams.getTeamTransactionsHistory.useQuery({
      teamId: currentTeam.id,
    });

  if (isLoading) {
    return (
      <ContentCentered>
        <HeaderTitle level="h1" text="Transfer history" />
        <div>Loading...</div>
      </ContentCentered>
    );
  }

  return (
    <ContentCentered className="lg:px-6">
      <HeaderTitle level="h1" text="Transfer history" />
      {transactions && transactions.length > 0 ? (
        <Table>
          <TableCaption>List of your teams transfers.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Wallet</TableHead>
              <TableHead>Token</TableHead>
              <TableHead>Transaction ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Approved Date</TableHead>
              <TableHead>Memo</TableHead>
              <TableHead>Creator</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell className="font-medium">
                  {transaction.wallet.walletAddress}
                </TableCell>
                <TableCell className="max-w-[100px] truncate">
                  {transaction.token}
                </TableCell>{" "}
                <TableCell>
                  <a
                    href={config.urls.nearBlocks.txDetails(
                      transaction.createRequestTxnId,
                    )}
                    target="_blank"
                    className="font-bold underline"
                  >
                    {transaction.createRequestTxnId.slice(0, 8) + "..."}
                  </a>
                </TableCell>
                <TableCell>
                  {new Date(transaction.creationDate).toLocaleString()}
                </TableCell>
                <TableCell>
                  {transaction.approvedDate &&
                    new Date(transaction.approvedDate).toLocaleString()}
                </TableCell>
                <TableCell>{transaction.memo || "N/A"}</TableCell>
                <TableCell>{transaction.creatorMail}</TableCell>
                <TableCell className="text-right">
                  {transaction.amount.toString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p>No transaction history.</p>
      )}
    </ContentCentered>
  );
};

History.getLayout = getSidebarLayout;

export default History;
