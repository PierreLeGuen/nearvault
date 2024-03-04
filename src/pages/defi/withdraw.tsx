import ContentCentered from "~/components/ContentCentered";
import { getSidebarLayout } from "~/components/Layout";
import { RefYourDeposits } from "~/components/defi/RefYourDeposits";
import HeaderTitle from "~/components/ui/header";
import { NextPageWithLayout } from "../_app";

const Withdraw: NextPageWithLayout = () => {
  return (
    <ContentCentered>
      <HeaderTitle level="h1">Withdraw from Ref pool</HeaderTitle>
      <RefYourDeposits />
    </ContentCentered>
  );
};

Withdraw.getLayout = getSidebarLayout;

export default Withdraw;
