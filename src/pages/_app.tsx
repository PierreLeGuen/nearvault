import { config } from "@fortawesome/fontawesome-svg-core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StoreProvider, useStoreRehydrated } from "easy-peasy";
import { SessionProvider } from "next-auth/react";
import { api } from "~/lib/api";
import { store } from "~/store-easy-peasy/store";

import { type NextPage } from "next";
import { type Session } from "next-auth";
import { type AppProps } from "next/app";
import { type ReactElement, type ReactNode } from "react";
import { ToastContainer } from "react-toastify";

import "@fortawesome/fontawesome-svg-core/styles.css";
import "@near-wallet-selector/modal-ui/styles.css";
import "react-toastify/dist/ReactToastify.css";
import { WalletHome } from "~/components/Modal/ModalHome";
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

const RehydrateWrapper = ({ children }) => {
  const isRehydrated = useStoreRehydrated();
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
            {layout}
            <ToastContainer />
            <WalletHome />
          </RehydrateWrapper>
        </StoreProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}

export default api.withTRPC(MyApp);
