import { getSidebarLayout } from "~/components/layout";
import { type NextPageWithLayout } from "../_app";

const CreateLockup: NextPageWithLayout = () => {
  return (
    <div className="prose">
      <h1>Create Lockup</h1>
    </div>
  );
};

CreateLockup.getLayout = getSidebarLayout;
export default CreateLockup;
