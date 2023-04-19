import Layout from "~/components/layout";
import { type NextPageWithLayout } from "../_app";

const ManageLockup: NextPageWithLayout = () => {
  return (
    <div>
      <h1>Manage Lockup</h1>
    </div>
  );
};

ManageLockup.getLayout = function getLayout(page) {
  return <Layout>{page}</Layout>;
};

export default ManageLockup;
