import { z } from "zod";
import ContentCentered from "~/components/ContentCentered";
import { getSidebarLayout } from "~/components/Layout";
import { DropdownFormField } from "~/components/inputs/dropdown";
import { SenderFormField } from "~/components/inputs/sender";
import { Button } from "~/components/ui/button";
import { Form } from "~/components/ui/form";
import HeaderTitle from "~/components/ui/header";
import { EXCHANGES, useSupportedExchange } from "~/hooks/defi";
import { useZodForm } from "~/hooks/form";
import {
  useGetAllTokensWithBalanceForWallet,
  useTeamsWalletsWithLockups,
} from "~/hooks/teams";
import { getFormattedAmount } from "~/lib/transformations";
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
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <SenderFormField
            isLoading={walletsQuery.isLoading}
            wallets={walletsQuery.data?.filter((w) => !w.isLockup)}
            name="funding"
            control={form.control}
            rules={{
              required: "Please select a wallet.",
            }}
            description="Funding wallet."
            placeholder="Select a wallet"
            label="Sender"
          />

          <DropdownFormField
            isLoading={exchangeQuery.isLoading}
            items={exchangeQuery.data?.map((exchange) => ({
              id: exchange,
              name: exchange,
            }))}
            name="exchangeId"
            control={form.control}
            rules={{
              required: "Please select an exchange.",
            }}
            description="Select a DEX to swap tokens."
            placeholder="Select a DEX"
            label="Exchange"
          />

          <DropdownFormField
            isLoading={tokensQuery.isLoading}
            items={tokensQuery.data?.map((token) => ({
              id: token.account_id,
              name: `${token.symbol} (max. ${getFormattedAmount(token)})`,
            }))}
            name="tokensOutId"
            control={form.control}
            rules={{
              required: "Please select an exchange.",
            }}
            description="Select a token to swap."
            placeholder="Select a token to swap"
            label="Out"
          />

          <DropdownFormField
            isLoading={tokensQuery.isLoading}
            items={tokensQuery.data?.map((token) => ({
              id: token.account_id,
              name: `${token.symbol} (max. ${getFormattedAmount(token)})`,
            }))}
            name="tokenInId"
            control={form.control}
            rules={{
              required: "Please select an exchange.",
            }}
            description="Select a token to swap."
            placeholder="Select a token to swap"
            label="In"
          />

          <Button type="submit">Create swap request</Button>
        </form>
      </Form>
    </ContentCentered>
  );
};

Swap.getLayout = getSidebarLayout;

export default Swap;
