import ContentCentered from "~/components/ContentCentered";
import { getSidebarLayout } from "~/components/Layout";
import BurrowWithdraw from "~/components/defi/BurrowWithdraw";
import { RefYourDeposits } from "~/components/defi/RefYourDeposits";
import HeaderTitle from "~/components/ui/header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { type NextPageWithLayout } from "../_app";

const Withdraw: NextPageWithLayout = () => {
  return (
    <ContentCentered>
      <HeaderTitle level="h1">Withdraw stable liquidity</HeaderTitle>
      <Tabs defaultValue="a">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="a">Ref Finance</TabsTrigger>
          <TabsTrigger value="b">Burrow Finance</TabsTrigger>
        </TabsList>
        <TabsContent value="a">
          <RefYourDeposits />
        </TabsContent>
        <TabsContent value="b">
          <BurrowWithdraw />
        </TabsContent>
      </Tabs>
    </ContentCentered>
  );
};

Withdraw.getLayout = getSidebarLayout;

export default Withdraw;
