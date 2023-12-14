import { type Wallet } from "@prisma/client";
import type * as naj from "near-api-js";
import { FungibleTokenMetadata } from "~/lib/ft/contract";
import { calculateLockup } from "~/lib/lockup/lockup";
import { type WalletPretty } from "~/pages/staking/stake";

export const dbDataToTransfersData = async ({
  data,
  getNearConnection,
}: {
  data: Wallet[];
  getNearConnection: () => Promise<naj.Near>;
}) => {
  const w: WalletPretty[] = [];
  for (const wallet of data) {
    w.push({
      walletDetails: wallet,
      prettyName: wallet.walletAddress,
      isLockup: false,
      ownerAccountId: undefined,
    });
    try {
      const lockupValue = calculateLockup(wallet.walletAddress, "lockup.near");
      const nearConn = await getNearConnection();
      await (await nearConn.account(lockupValue)).state();

      w.push({
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
  }
  return w;
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
