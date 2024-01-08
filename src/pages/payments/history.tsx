import { getSidebarLayout } from "~/components/Layout";
import { api } from "~/lib/api";
import usePersistingStore from "~/store/useStore";
import { type NextPageWithLayout } from "../_app";
import { config } from '~/config/config';

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
      <div className="p-3">
        <h1 className="mb-4 text-2xl font-semibold">Transfer history</h1>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-3">
      <h1 className="mb-4 text-2xl font-semibold">Transfer history</h1>
      {transactions && transactions.length > 0 ? (
        <table className="w-full table-auto">
          <thead>
            <tr>
              <th className="px-4 py-2">Wallet</th>
              <th className="px-4 py-2">Token</th>
              <th className="px-4 py-2">Create request txn ID</th>
              <th className="px-4 py-2">Amount</th>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Approved Date</th>
              <th className="px-4 py-2">Memo</th>
              <th className="px-4 py-2">Creator</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction.id}>
                <td className="border px-4 py-2">
                  {transaction.wallet.walletAddress}
                </td>
                <td className="border px-4 py-2">{transaction.token}</td>
                <td className="border px-4 py-2">
                  <a
                    href={config.urls.nearBlocks.txDetails(transaction.createRequestTxnId)}
                    target="_blank"
                    className="font-bold underline"
                  >
                    {transaction.createRequestTxnId.slice(0, 8) + "..."}
                  </a>
                </td>
                <td className="border px-4 py-2">
                  {transaction.amount.toString()}
                </td>
                <td className="border px-4 py-2">
                  {new Date(transaction.creationDate).toLocaleString()}
                </td>
                <td className="border px-4 py-2">
                  {transaction.approvedDate &&
                    new Date(transaction.approvedDate).toLocaleString()}
                </td>
                <td className="border px-4 py-2">
                  {transaction.memo || "N/A"}
                </td>
                <td className="border px-4 py-2">{transaction.creatorMail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No transaction history.</p>
      )}
    </div>
  );
};

History.getLayout = getSidebarLayout;

export default History;
