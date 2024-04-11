import { z } from "zod";
import ContentCentered from "~/components/ContentCentered";
import { getSidebarLayout } from "~/components/Layout";
import RefSwap from "~/components/defi/RefSwap";
import HeaderTitle from "~/components/ui/header";
import { EXCHANGES, useSupportedExchange } from "~/hooks/defi";
import { useZodForm } from "~/hooks/form";
import {
  useGetAllTokensWithBalanceForWallet,
  useTeamsWalletsWithLockups,
} from "~/hooks/teams";
import { type NextPageWithLayout } from "../_app";

const formSchema = z.object({
  tokensOutId: z.string(),
  tokenInId: z.string(),
  exchangeId: z.enum(EXCHANGES),
  funding: z.string(),
});

const Swap: NextPageWithLayout = () => {
  const form = useZodForm(formSchema);
  const exchangeQuery = useSupportedExchange();
  const walletsQuery = useTeamsWalletsWithLockups();
  const tokensQuery = useGetAllTokensWithBalanceForWallet(
    form.watch("funding"),
  );

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    console.log(values);
  };

  return (
    <ContentCentered>
      <HeaderTitle level="h1" text="Swap" />
      <RefSwap />
    </ContentCentered>
  );
};

Swap.getLayout = getSidebarLayout;

export default Swap;
