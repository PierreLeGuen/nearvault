import { FC, type ReactNode } from "react";
import { Sidebar } from "./Sidebar/sidebarnew";

// TODO Rename on SidebarLayout !!!
const Layout: FC<{
  children: ReactNode;
}> = ({ children }) => {
  return (
    <div className="relative flex min-h-screen flex-row overflow-visible">
      <Sidebar className="sticky top-0 flex h-screen w-[20%] flex-col border-r-2" />
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
