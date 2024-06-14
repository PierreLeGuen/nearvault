import ContentCentered from "~/components/ContentCentered";
import { getSidebarLayout } from "~/components/Layout";
import BurrowClaim from "~/components/defi/BurrowClaim";
import HeaderTitle from "~/components/ui/header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { type NextPageWithLayout } from "../_app";

const ClaimRewards: NextPageWithLayout = () => {
  return (
    <ContentCentered>
      <HeaderTitle level="h1" text="Claim rewards" />
      <Tabs defaultValue="a">
        <TabsList className="grid w-full">
          <TabsTrigger value="a">Burrow Finance</TabsTrigger>
        </TabsList>
        <TabsContent value="a">
          <BurrowClaim />
        </TabsContent>
      </Tabs>
    </ContentCentered>
  );
};

ClaimRewards.getLayout = getSidebarLayout;

export default ClaimRewards;
