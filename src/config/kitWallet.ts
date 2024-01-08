export type KitWalletUrls = {
  stakingPools: string;
  keyAccounts: (publicKey: string) => string;
  likelyTokens: (accountId: string) => string;
  stakingDeposits: (accountId: string) => string;
}

export const createKitWalletUrls = (origin: string): KitWalletUrls => ({
  stakingPools: `${origin}/stakingPools`,
  keyAccounts: (publicKey) =>
    `${origin}/publicKey/${publicKey}/accounts`,
  likelyTokens: (accountId) =>
    `${origin}/account/${accountId}/likelyTokensFromBlock?fromBlockTimestamp=0`,
  stakingDeposits: (accountId) =>
    `${origin}/staking-deposits/${accountId}`,
});