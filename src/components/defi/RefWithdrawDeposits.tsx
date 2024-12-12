import { toast } from "react-toastify";
import { Button } from "~/components/ui/button";
import { useGetRefDeposits, useRefWithdraw } from "~/hooks/defi";
import { useListWallets } from "~/hooks/teams";
import HeaderTitle from "../ui/header";

export function RefWithdrawDeposits() {
    const { data: wallets = [] } = useListWallets();
    const withdrawMutation = useRefWithdraw();

    const handleWithdraw = async (fundingAccId: string, tokenId: string, amount: string) => {
        try {
            await withdrawMutation.mutateAsync({
                fundingAccId,
                tokenId,
                amount,
            });
            toast.success(`Successfully added request to withdraw ${tokenId}`);
        } catch (error) {
            console.error("Error withdrawing:", error);
            toast.error(`Failed to add withdraw request for ${tokenId}: ${(error as Error).message}`);
        }
    };

    if (wallets.length === 0) {
        return <div>No wallets found</div>;
    }

    return (
        <div className="mt-8 space-y-8">
            <hr />
            <HeaderTitle level="h2">Withdraw pending deposits</HeaderTitle>

            {wallets.map((wallet) => (
                <div key={wallet.id} className="space-y-4">
                    <HeaderTitle level="h3" text={wallet.walletAddress} />
                    <WalletDeposits
                        accountId={wallet.walletAddress}
                        onWithdraw={(tokenId, amount) => handleWithdraw(wallet.walletAddress, tokenId, amount)}
                        withdrawingTokenId={withdrawMutation.isLoading ? withdrawMutation.variables?.tokenId : null}
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

function WalletDeposits({ accountId, onWithdraw, withdrawingTokenId }: WalletDepositsProps) {
    const { data, isLoading } = useGetRefDeposits(accountId);

    if (isLoading) {
        return <div>Loading deposits...</div>;
    }

    if (!data || Object.keys(data).length === 0) {
        return <div>No deposits found in REF for this wallet</div>;
    }

    return (
        <div className="space-y-2">
            {Object.entries(data).map(([tokenId, { amount, formattedAmount, metadata }]) => (
                <div
                    key={tokenId}
                    className="flex items-center justify-between p-4 border rounded-lg"
                >
                    <div>
                        <div className="font-medium">{tokenId}</div>
                        <div className="text-sm text-gray-500">
                            {formattedAmount} {metadata?.symbol}
                        </div>
                    </div>
                    <Button
                        onClick={() => onWithdraw(tokenId, amount)}
                        variant="outline"
                        disabled={withdrawingTokenId === tokenId}
                    >
                        {withdrawingTokenId === tokenId ? "Withdrawing..." : "Withdraw"}
                    </Button>
                </div>
            ))}
        </div>
    );
}
