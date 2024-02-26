export type KitWalletUrls = {
  stakingPools: string;
};

export const createKitWalletUrls = (origin: string): KitWalletUrls => ({
  stakingPools: `${origin}/stakingPools`,
});
