import ContentCentered from "~/components/ContentCentered";
import { getSidebarLayout } from "~/components/Layout";
import BurrowSupply from "~/components/defi/BurrowSupply";
import RefLiquidityPools from "~/components/defi/RefLiquidityPools";
import HeaderTitle from "~/components/ui/header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { type NextPageWithLayout } from "../_app";

const LiquidityPools: NextPageWithLayout = () => {
  return (
    <ContentCentered>
      <HeaderTitle level="h1" text="Liquidity Pools" />
      <Tabs defaultValue="a">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="a">Ref Finance</TabsTrigger>
          <TabsTrigger value="b">Burrow Finance</TabsTrigger>
        </TabsList>
        <TabsContent value="a">
          <RefLiquidityPools />
        </TabsContent>
        <TabsContent value="b">
          <BurrowSupply />
        </TabsContent>
      </Tabs>
    </ContentCentered>
  );
};

LiquidityPools.getLayout = getSidebarLayout;

export default LiquidityPools;
