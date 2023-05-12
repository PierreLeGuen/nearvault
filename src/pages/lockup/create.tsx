import { useSession } from "next-auth/react";
import { getSidebarLayout } from "~/components/Layout";
import { type NextPageWithLayout } from "../_app";

const CreateLockup: NextPageWithLayout = () => {
  useSession({ required: true });

  return (
    <div className="prose">
      <h1>Create Lockup</h1>
    </div>
  );
};

CreateLockup.getLayout = getSidebarLayout;
export default CreateLockup;
