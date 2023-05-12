import { type ReactNode } from "react";

const WelcomeLayout = ({ children }: { children: ReactNode }) => (
  <div>{children}</div>
);

export default function getWelcomeLayout(page: ReactNode) {
  return <WelcomeLayout>{page}</WelcomeLayout>;
}
