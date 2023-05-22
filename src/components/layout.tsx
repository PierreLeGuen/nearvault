import { type ReactNode } from "react";
import { useWalletSelector } from "~/context/wallet";
import usePersistingStore from "~/store/useStore";
import Sidebar from "./Sidebar/Sidebar";

const Layout: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  const { modal } = useWalletSelector();
  const store = usePersistingStore();

  const handleSignIn = () => {
    modal.show();
  };

  return (
    <div className="relative flex min-h-screen flex-row overflow-visible">
      <div className="relative w-64 overflow-visible">
        <Sidebar />
      </div>
      <div className="flex flex-1 flex-col">
        <div className="flex flex-row px-8 py-2 shadow-md">
          <div className="flex flex-1"></div>
          {store.accountId && (
            // TODO: switch account, disconnect, ...
            <button
              className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              onClick={() => {
                handleSignIn();
              }}
            >
              Ⓝ {store.accountId}
            </button>
          )}
          {!store.accountId && (
            <button
              className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              onClick={() => {
                handleSignIn();
              }}
            >
              Ⓝ Sign In
            </button>
          )}
        </div>
        <div className="h-full bg-slate-100">{children}</div>
      </div>
    </div>
  );
};

export function getSidebarLayout(page: ReactNode) {
  return <Layout>{page}</Layout>;
}

export default Layout;
