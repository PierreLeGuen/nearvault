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
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <div className="flex flex-row px-8 py-2 shadow-md">
          <div className="flex flex-1"></div>
          {store.publicKey && (
            // TODO: switch account, disconnect, ...
            <button
              className="inline-flex justify-center rounded-md border border-transparent bg-blue-100 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              onClick={() => {
                handleSignIn();
              }}
            >
              Ⓝ {store.publicKey.toString()}
            </button>
          )}
          {!store && (
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
        <div className="flex h-full flex-grow bg-slate-100">{children}</div>
      </div>
    </div>
  );
};

export function getSidebarLayout(page: ReactNode) {
  return <Layout>{page}</Layout>;
}

export default Layout;
