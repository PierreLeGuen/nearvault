export type NearBlocksUrls = {
  txDetails: (hash: string) => string;
  accountDetails: (accountId: string) => string;
};

export const createNearBlocksUrls = (origin: string): NearBlocksUrls => ({
  txDetails: (hash) => `${origin}/txns/${hash}`,
  accountDetails: (accountId) => `${origin}/address/${accountId}`,
});
