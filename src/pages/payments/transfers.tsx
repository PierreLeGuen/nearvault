import { getSidebarLayout } from "~/components/layout";
import { type NextPageWithLayout } from "../_app";

const Transfers: NextPageWithLayout = () => {
  return <div>Transfers</div>;
};

Transfers.getLayout = getSidebarLayout;

export default Transfers;
