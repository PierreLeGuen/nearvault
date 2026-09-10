import ContentCentered from "~/components/ContentCentered";
import { getSidebarLayout } from "~/components/Layout";
import RefLiquidityPools from "~/components/defi/RefLiquidityPools";
import HeaderTitle from "~/components/ui/header";
import { STABLE_LIKE_POOL_KINDS } from "~/lib/defi/requests";
import { type NextPageWithLayout } from "../_app";

const StablePoolsRefDeposit: NextPageWithLayout = () => {
  return (
    <ContentCentered>
      <HeaderTitle level="h1">
        Deposit to Stable, Rated and ALMM pools
      </HeaderTitle>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Rhea pools running on the StableSwap engine: stablecoin pools, rated
        pools for liquid-staking tokens and ALMM pools such as wNEAR/USDt. The
        deposit request calls add_stable_liquidity with a minimum-shares guard.
      </p>
      <RefLiquidityPools poolKinds={STABLE_LIKE_POOL_KINDS} />
    </ContentCentered>
  );
};

StablePoolsRefDeposit.getLayout = getSidebarLayout;

export default StablePoolsRefDeposit;
