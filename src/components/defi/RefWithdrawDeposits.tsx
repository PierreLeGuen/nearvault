import { toast } from "react-toastify";
import { Button } from "~/components/ui/button";
import {
  useGetRefDeposits,
  useGetTokenStorageBalance,
  useRefWithdraw,
} from "~/hooks/defi";
import { useListWallets } from "~/hooks/teams";
import HeaderTitle from "../ui/header";

export function RefWithdrawDeposits() {
  const { data: wallets = [] } = useListWallets();
  const withdrawMutation = useRefWithdraw();

  const handleWithdraw = async (
    fundingAccId: string,
    tokenId: string,
    amount: string,
  ) => {
    try {
      const result = await withdrawMutation.mutateAsync({
        fundingAccId,
        tokenId,
        amount,
      });
      if (result?.requestType === "storage_deposit") {
        toast.success(`Storage registration request created for ${tokenId}`);
        return;
      }

      toast.success(`Withdraw request created for ${tokenId}`);
    } catch (error) {
      console.error("Error withdrawing:", error);
      toast.error(
        `Failed to add withdraw request for ${tokenId}: ${
          (error as Error).message
        }`,
      );
    }
  };

  if (wallets.length === 0) {
    return <div>No wallets found</div>;
  }

  return (
    <div className="mt-8 space-y-8">
      <hr />
      <HeaderTitle level="h2">Withdraw Rhea internal deposits</HeaderTitle>
      <p>Pending deposits appear here after liquidity removal is executed.</p>

      {wallets.map((wallet) => (
        <div key={wallet.id} className="space-y-4">
          <HeaderTitle level="h3" text={wallet.walletAddress} />
          <WalletDeposits
            accountId={wallet.walletAddress}
            onWithdraw={(tokenId, amount) =>
              handleWithdraw(wallet.walletAddress, tokenId, amount)
            }
            withdrawingTokenId={
              withdrawMutation.isLoading
                ? withdrawMutation.variables?.tokenId
                : null
            }
          />
        </div>
      ))}
    </div>
  );
}

interface WalletDepositsProps {
  accountId: string;
  onWithdraw: (tokenId: string, amount: string) => void;
  withdrawingTokenId: string | null;
}

function WalletDeposits({
  accountId,
  onWithdraw,
  withdrawingTokenId,
}: WalletDepositsProps) {
  const { data, isLoading } = useGetRefDeposits(accountId);

  if (isLoading) {
    return <div>Loading deposits...</div>;
  }

  if (!data || Object.keys(data).length === 0) {
    return <div>No deposits found in REF for this wallet</div>;
  }

  return (
    <div className="space-y-2">
      {Object.entries(data).map(([tokenId, deposit]) => (
        <WalletDepositRow
          key={tokenId}
          accountId={accountId}
          tokenId={tokenId}
          amount={deposit.amount}
          formattedAmount={deposit.formattedAmount}
          symbol={deposit.metadata?.symbol}
          onWithdraw={onWithdraw}
          isWithdrawing={withdrawingTokenId === tokenId}
        />
      ))}
    </div>
  );
}

function WalletDepositRow({
  accountId,
  tokenId,
  amount,
  formattedAmount,
  symbol,
  onWithdraw,
  isWithdrawing,
}: {
  accountId: string;
  tokenId: string;
  amount: string;
  formattedAmount: string;
  symbol?: string;
  onWithdraw: (tokenId: string, amount: string) => void;
  isWithdrawing: boolean;
}) {
  const storageBalanceQuery = useGetTokenStorageBalance(tokenId, accountId);
  const needsStorageRegistration = storageBalanceQuery.data === null;

  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div>
        <div className="font-medium">{tokenId}</div>
        <div className="text-sm text-gray-500">
          {formattedAmount} {symbol}
        </div>
        <div className="mt-1 text-xs text-gray-500">
          Storage:{" "}
          {storageBalanceQuery.isLoading
            ? "checking..."
            : needsStorageRegistration
            ? "registration needed"
            : "registered"}
        </div>
      </div>
      <Button
        onClick={() => onWithdraw(tokenId, amount)}
        variant="outline"
        disabled={isWithdrawing || storageBalanceQuery.isLoading}
      >
        {isWithdrawing
          ? "Creating request..."
          : needsStorageRegistration
          ? "Register wallet"
          : "Withdraw deposit"}
      </Button>
    </div>
  );
}
