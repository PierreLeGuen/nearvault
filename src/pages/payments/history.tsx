import { getSidebarLayout } from "~/components/Layout";
import { type NextPageWithLayout } from "../_app";

const History: NextPageWithLayout = () => {
  return (
    <div className="prose">
      <h1>Transfer history</h1>
      <div>Todo</div>
    </div>
  );
};

History.getLayout = getSidebarLayout;

export default History;
