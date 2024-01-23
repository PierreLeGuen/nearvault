import { getSidebarLayout } from "~/components/Layout";
import { NextPageWithLayout } from "./_app";

const Dashboard: NextPageWithLayout = () => {
  return <div>Dashboard</div>;
};

Dashboard.getLayout = getSidebarLayout;

export default Dashboard;
