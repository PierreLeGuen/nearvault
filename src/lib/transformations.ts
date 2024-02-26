import { type Wallet } from "@prisma/client";
import type * as naj from "near-api-js";
import { FungibleTokenMetadata } from "~/lib/ft/contract";
import { calculateLockup } from "~/lib/lockup/lockup";
import { type WalletPretty } from "~/pages/staking/stake";
import { config } from "~/config/config";

export const dbDataToTransfersData = async ({
  data,
  getNearConnection,
}: {
  data: Wallet[];
  getNearConnection: () => Promise<naj.Near>;
}) => {
  const nearConn = await getNearConnection();
  const promises = data.map(async (wallet) => {
    const walletPretty: WalletPretty[] = [
      {
        walletDetails: wallet,
        prettyName: wallet.walletAddress,
        isLockup: false,
        ownerAccountId: undefined,
      },
    ];

    try {
      const lockupValue = calculateLockup(
        wallet.walletAddress,
        config.accounts.lockupFactory,
      );
      await (await nearConn.account(lockupValue)).state();

      walletPretty.push({
        prettyName: "Lockup of " + wallet.walletAddress,
        walletDetails: {
          walletAddress: lockupValue,
          id: lockupValue,
          teamId: "na",
        },
        isLockup: true,
        ownerAccountId: wallet.walletAddress,
      });
    } catch (_) {}

    return walletPretty;
  });

  const results = await Promise.all(promises);
  return results.flat();
};

export function getFormattedAmount(token: {
  balance: string;
  decimals: number;
  symbol: string;
}) {
  return `${(
    parseInt(token.balance || "") /
    10 ** (token.decimals || 0)
  ).toLocaleString()} ${token.symbol}`;
}

export interface LikelyTokens {
  version: string;
  lastBlockTimestamp: string;
  list: string[];
}

export interface Token extends FungibleTokenMetadata {
  balance: string;
  account_id: string;
}
