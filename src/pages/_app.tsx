import { SessionProvider } from "next-auth/react";
import { type AppProps } from "next/app";

import { config } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import { api } from "~/libs/api";
config.autoAddCss = false;

import { type NextPage } from "next";
import { type Session } from "next-auth";
import { type ReactElement, type ReactNode } from "react";
import "~/styles/globals.css";

export type NextPageWithLayout<P = unknown, IP = P> = NextPage<P, IP> & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
  session: Session;
};

function MyApp({ Component, pageProps, session }: AppPropsWithLayout) {
  const { getLayout } = Component;

  const pageContent = <Component {...pageProps} />;

  const layout = getLayout ? getLayout(pageContent) : pageContent;

  return <SessionProvider session={session}>{layout}</SessionProvider>;
}

export default api.withTRPC(MyApp);
