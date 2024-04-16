import ContentCentered from "~/components/ContentCentered";
import { getSidebarLayout } from "~/components/Layout";
import RefSwap from "~/components/defi/RefSwap";
import HeaderTitle from "~/components/ui/header";
import { type NextPageWithLayout } from "../_app";

const Swap: NextPageWithLayout = () => {
  return (
    <ContentCentered>
      <HeaderTitle level="h1" text="Swap" />
      <RefSwap />
    </ContentCentered>
  );
};

Swap.getLayout = getSidebarLayout;

export default Swap;
