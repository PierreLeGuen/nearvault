import { type ReactNode, FC } from "react";
import Sidebar from "./Sidebar/Sidebar";

// TODO Rename on SidebarLayout !!!
const Layout: FC<{
  children: ReactNode;
}> = ({ children }) => {
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
  return <Layout>{page}</Layout>;
}

export default Layout;
