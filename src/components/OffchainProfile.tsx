import { signIn, signOut, useSession } from "next-auth/react";
import RoundedAvatar from "./RoundedAvatar";

export default function OffchainProfile() {
  const { data: session } = useSession();
  if (!session) {
    return (
      <>
        Not signed in <br />
        <button onClick={() => void signIn()}>Sign in</button>
      </>
    );
  }

  let avatar = null;
  if (session.user.image) {
    avatar = <RoundedAvatar imageUrl={session.user.image} />;
  }

  return (
    <>
      <div className="flex flex-row items-center gap-3">
        <div className="">{avatar}</div>
        <div className="flex flex-col">
          <div>{session.user.name}</div>
          <div
            onClick={() => void signOut()}
            className="text-sm hover:cursor-pointer hover:underline"
          >
            Sign out
          </div>
        </div>
      </div>
    </>
  );
}
