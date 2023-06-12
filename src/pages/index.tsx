import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import getWelcomeLayout from "~/components/WelcomeLayout";
import { type NextPageWithLayout } from "./_app";

const Home: NextPageWithLayout = () => {
  const { data: sessionData, status } = useSession();

  // Determine user's name or a default greeting
  const userName = sessionData?.user?.name ? sessionData.user.name : "there";

  // Determine the main content based on session status
  let mainContent;
  if (status === "loading") {
    mainContent = <p>Loading...</p>;
  } else if (sessionData) {
    mainContent = (
      <>
        <h2>Welcome back, {userName}!</h2>
        <p>Ready to continue?</p>
        <Link
          href={"/lockup/manage"}
          className="rounded-md bg-blue-300 px-4 py-2 hover:bg-blue-100"
        >
          Continue
        </Link>
      </>
    );
  } else {
    mainContent = (
      <>
        <p>
          You need to be signed in to access this app. Please sign in to
          continue.
        </p>
        <button
          onClick={() => void signIn()}
          className="rounded-md bg-blue-300 px-4 py-2 hover:bg-blue-100"
        >
          Sign in
        </button>
      </>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3">
      {mainContent}
    </div>
  );
};

Home.getLayout = getWelcomeLayout;

export default Home;
