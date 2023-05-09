import { config } from "@fortawesome/fontawesome-svg-core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { NearContextProvider } from "~/context/near";
import { WalletSelectorContextProvider } from "~/context/wallet";
import { api } from "~/libs/api";

import { type NextPage } from "next";
import { type Session } from "next-auth";
import { type AppProps } from "next/app";
import { type ReactElement, type ReactNode } from "react";

import "@fortawesome/fontawesome-svg-core/styles.css";
import "@near-wallet-selector/modal-ui/styles.css";
import { createContext, createStore } from "zustand";
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

const StoreContext = createContext();
const store = createStore();

function MyApp({ Component, pageProps, session }: AppPropsWithLayout) {
  const { getLayout } = Component;

  const pageContent = <Component {...pageProps} />;

  const layout = getLayout ? getLayout(pageContent) : pageContent;

  return (
    <SessionProvider session={session}>
      <StoreContext.Provider value={store}>
        <QueryClientProvider client={queryClient}>
          <NearContextProvider>
            <WalletSelectorContextProvider>
              {layout}
            </WalletSelectorContextProvider>
          </NearContextProvider>
        </QueryClientProvider>
      </StoreContext.Provider>
    </SessionProvider>
  );
}

export default api.withTRPC(MyApp);
