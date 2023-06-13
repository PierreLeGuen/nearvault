import { getSidebarLayout } from "~/components/Layout";
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
    return <div>Loading...</div>;
  }

  return (
    <div className="prose p-3">
      <h1>Transfer history</h1>
      {transactions && transactions.length > 0 ? (
        <ul>
          {transactions.map((transaction) => (
            <li key={transaction.id}>
              <p>Token: {transaction.token}</p>
              <p>Amount: {transaction.amount.toString()}</p>
              <p>Date: {new Date(transaction.creationDate).toLocaleString()}</p>
              <p>
                Approved Date:{" "}
                {transaction.approvedDate &&
                  new Date(transaction.approvedDate).toLocaleString()}
              </p>
              <p>Memo: {transaction.memo || "N/A"}</p>
              <p>Creator: {transaction.creatorMail}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>No transaction history.</p>
      )}
    </div>
  );
};

History.getLayout = getSidebarLayout;

export default History;
