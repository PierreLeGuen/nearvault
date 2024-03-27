import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { type FC, type ReactNode } from "react";
import { Sidebar } from "./Sidebar/Sidebar";

const SidebarLayout: FC<{
  children: ReactNode;
}> = ({ children }) => {
  const session = useSession();
  const router = useRouter();

  if (session.status == "loading") {
    return <div>Loading...</div>;
  }
  if (!session.data) {
    router.push("/auth/signin").catch(console.error);
    return null;
  }

  return (
    <div className="relative flex min-h-screen flex-row overflow-visible">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <div className="flex h-full max-w-full flex-grow">{children}</div>
      </div>
    </div>
  );
};

export function getSidebarLayout(page: ReactNode) {
  return <SidebarLayout>{page}</SidebarLayout>;
}

export default SidebarLayout;
