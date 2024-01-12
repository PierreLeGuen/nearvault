export type NearBlocksApiUrls = {
  getAccountsUrl: (publicKey: string) => string;
};

export const createNearBlocksApiUrls = (origin: string): NearBlocksApiUrls => ({
  getAccountsUrl: (publicKey) => `${origin}/keys/${publicKey}`,
});
