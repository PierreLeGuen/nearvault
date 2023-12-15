import { config } from "@fortawesome/fontawesome-svg-core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StoreProvider } from "easy-peasy";
import { SessionProvider } from "next-auth/react";
import { useEffect } from "react";
import { useStoreRehydrated } from "easy-peasy";
import { NearContextProvider } from "~/context/near";
import { WalletSelectorContextProvider } from "~/context/wallet";
import { api } from "~/lib/api";
import { store } from "~/store-easy-peasy/store";

import { type NextPage } from "next";
import { type Session } from "next-auth";
import { type AppProps } from "next/app";
import { type ReactElement, type ReactNode } from "react";
import { ToastContainer } from "react-toastify";

import "@fortawesome/fontawesome-svg-core/styles.css";
import "@near-finance-near-wallet-selector/modal-ui/styles.css";
import "react-toastify/dist/ReactToastify.css";
import "~/styles/globals.css";

config.autoAddCss = false;

export type NextPageWithLayout<P = unknown, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
  session: Session;
};

const queryClient = new QueryClient();

// http://localhost:3000/approval/pending?transactionHashes=7iTdECfWC9L1p8DddV9r3ukhBqVhmVqS76w7msrN5Ukw - success tx
// http://localhost:3000/approval/pending?errorCode=Error&errorMessage=%257B%2522index%2522%253A0%252C%2522kind%2522%253A%257B%2522ExecutionError%2522%253A%2522Exceeded%2520the%2520account%2520balance.%2522%257D%257D
// http://localhost:3000/approval/pending?errorCode=userRejected&errorMessage=User%2520rejected%2520transaction
const RehydrateWrapper = ({ children }: any) => {
  const isRehydrated = useStoreRehydrated();

  useEffect(() => {
    console.log("isRehydrated", isRehydrated);
  }, [isRehydrated]);

  return !isRehydrated ? <div>Loading...</div> : children;
};

function MyApp({ Component, pageProps, session }: AppPropsWithLayout) {
  const { getLayout } = Component;

  const pageContent = <Component {...pageProps} />;
  const layout = getLayout ? getLayout(pageContent) : pageContent;

  return (
    <SessionProvider session={session}>
      <QueryClientProvider client={queryClient}>
        <StoreProvider store={store}>
          <RehydrateWrapper>
            <NearContextProvider>
              <WalletSelectorContextProvider>
                {layout}
                <ToastContainer />
              </WalletSelectorContextProvider>
            </NearContextProvider>
          </RehydrateWrapper>
        </StoreProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}

export default api.withTRPC(MyApp);
